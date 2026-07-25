#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod process_manager;
mod service_ready;
use process_manager::ProcessManager;

use service_ready::{are_services_ready, is_service_ready_with_address, wait_for_service_port, wait_for_service_port_or_process_exit, wait_for_services, ServiceEndpoints};

use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use std::process::ExitStatus;

use rfd::{MessageButtons, MessageDialog, MessageDialogResult, MessageLevel};
use serde::Deserialize;
use tauri::path::BaseDirectory;
use tauri::{Manager, RunEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_SERVER_PORT: u16 = 3000;
const DEFAULT_CLIENT_PORT: u16 = 3001;
const DEFAULT_BOOTSTRAP_COMMAND: &str = "bun";
const RUNTIME_MANIFEST_RESOURCE_PATH: &str = "gen/runtime/manifest.json";
const STARTUP_LOG_DIRECTORY_NAME: &str = "BaoBuildBuddy";
const STARTUP_LOG_FILE_NAME: &str = "desktop-startup.log";
#[cfg(target_os = "windows")]
const WINDOWS_WEBVIEW2_APP_GUID: &str = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
#[cfg(target_os = "windows")]
const WINDOWS_CREATE_NO_WINDOW_FLAG: u32 = 0x08000000;

#[derive(Default)]
struct StackStartup {
    host: String,
    server_port: u16,
    client_port: u16,
}

impl StackStartup {
    fn from_env() -> Self {
        Self {
            host: std::env::var("BAO_STACK_HOST").unwrap_or_else(|_| DEFAULT_HOST.to_string()),
            server_port: read_env_u16("PORT", DEFAULT_SERVER_PORT).unwrap_or(DEFAULT_SERVER_PORT),
            client_port: read_env_u16("CLIENT_PORT", DEFAULT_CLIENT_PORT)
                .unwrap_or(DEFAULT_CLIENT_PORT),
        }
    }
}

impl ServiceEndpoints for StackStartup {
    fn host(&self) -> &str {
        self.host.as_str()
    }

    fn server_port(&self) -> u16 {
        self.server_port
    }

    fn client_port(&self) -> u16 {
        self.client_port
    }
}


#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackagedRuntimeManifest {
    server_executable: String,
    script_runner_executable: String,
    script_runner_entrypoint: Option<String>,
    #[cfg_attr(not(target_os = "windows"), allow(dead_code))]
    webview_bootstrapper_executable: Option<String>,
    scraper_dir: String,
    server_host: String,
    server_port: u16,
    cors_origins: Vec<String>,
}

struct PackagedRuntime {
    root: PathBuf,
    manifest: PackagedRuntimeManifest,
}

enum RuntimeMode {
    Packaged(PackagedRuntime),
    Workspace(PathBuf),
}

fn main() {
    let manager = ProcessManager::default();

    if let Err(error) = ensure_pre_app_runtime_requirements() {
        let message = build_startup_failure_message(&error);
        report_pre_app_failure("startup preflight failure", message.as_str());
        return;
    }

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(manager)
        .setup(move |app| {
            if let Err(error) = initialize_runtime(app) {
                report_startup_failure(app, &error);
                return Err(Box::new(error));
            }

            Ok(())
        });

    let app = match builder.build(tauri::generate_context!()) {
        Ok(app) => app,
        Err(error) => {
            let message = format!("BaoBuildBuddy desktop host failed to initialize: {error}");
            report_pre_app_failure("builder failure", message.as_str());
            return;
        }
    };

    app.run(|app_handle, event| match event {
        RunEvent::ExitRequested { .. } | RunEvent::Exit => {
            app_handle.state::<ProcessManager>().shutdown();
        }
        _ => {}
    });
}

fn initialize_runtime(app: &tauri::App) -> io::Result<()> {
    match resolve_runtime_mode(app)? {
        RuntimeMode::Packaged(runtime) => {
            match ensure_packaged_server_running(&runtime)? {
                Some(mut child) => {
                    if let Err(error) = wait_for_service_port_or_process_exit(
                        runtime.manifest.server_host.as_str(),
                        runtime.manifest.server_port,
                        &mut child,
                    ) {
                        terminate_child(&mut child);
                        return Err(error);
                    }
                    app.state::<ProcessManager>().set_child(child);
                }
                None => {
                    wait_for_service_port(
                        runtime.manifest.server_host.as_str(),
                        runtime.manifest.server_port,
                    )?;
                }
            }

            println!(
                "BaoBuildBuddy desktop host: bundled ui active, server on http://{}:{}",
                runtime.manifest.server_host, runtime.manifest.server_port
            );
        }
        RuntimeMode::Workspace(workspace_root) => {
            let startup = StackStartup::from_env();
            if let Some(child) = ensure_stack_running(&workspace_root, &startup)? {
                app.state::<ProcessManager>().set_child(child);
            }

            wait_for_services(&startup)?;
            println!(
                "BaoBuildBuddy desktop host: server on http://{}:{}, ui on http://{}:{}",
                startup.host, startup.server_port, startup.host, startup.client_port
            );
        }
    }

    Ok(())
}

fn report_startup_failure(app: &tauri::App, error: &io::Error) {
    let message = build_startup_failure_message(error);
    let log_path = write_startup_log("startup failure", message.as_str());
    let dialog_message = match log_path {
        Some(path) => format!("{message}\n\nStartup log: {}", path.display()),
        None => message.clone(),
    };

    eprintln!("{message}");
    app.dialog()
        .message(dialog_message)
        .title("BaoBuildBuddy failed to start")
        .kind(MessageDialogKind::Error)
        .blocking_show();
}

fn build_startup_failure_message(error: &io::Error) -> String {
    let mut message = format!("BaoBuildBuddy could not start.\n\n{error}");

    if cfg!(target_os = "windows") {
        message.push_str(
      "\n\nWindows desktop releases are 64-bit only. If this machine is running 32-bit Windows, the app will not launch.",
    );
    }

    message
}

fn report_pre_app_failure(context: &str, message: &str) {
    let log_path = write_startup_log(context, message);
    let dialog_message = match log_path {
        Some(path) => format!("{message}\n\nStartup log: {}", path.display()),
        None => message.to_string(),
    };

    eprintln!("{message}");
    show_native_message_dialog(
        "BaoBuildBuddy failed to start",
        dialog_message.as_str(),
        MessageLevel::Error,
        MessageButtons::Ok,
    );
}

fn show_native_message_dialog(
    title: &str,
    description: &str,
    level: MessageLevel,
    buttons: MessageButtons,
) -> MessageDialogResult {
    MessageDialog::new()
        .set_title(title)
        .set_description(description)
        .set_level(level)
        .set_buttons(buttons)
        .show()
}

fn write_startup_log(context: &str, message: &str) -> Option<PathBuf> {
    let log_path = resolve_startup_log_path();
    let parent_dir = log_path.parent()?;
    if fs::create_dir_all(parent_dir).is_err() {
        return None;
    }

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path.as_path())
        .ok()?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    let current_executable = std::env::current_exe()
        .map(|path| path.display().to_string())
        .unwrap_or_else(|_| "<unavailable>".to_string());
    let processor_architecture =
        std::env::var("PROCESSOR_ARCHITECTURE").unwrap_or_else(|_| "<unavailable>".to_string());
    let processor_architecture_wow64 =
        std::env::var("PROCESSOR_ARCHITEW6432").unwrap_or_else(|_| "<unavailable>".to_string());

    let _ = writeln!(
    file,
    "[{timestamp}] {context}\nos={}\narch={}\nexe={current_executable}\nprocessor_architecture={processor_architecture}\nprocessor_architecture_wow64={processor_architecture_wow64}\nmessage={message}\n",
    std::env::consts::OS,
    std::env::consts::ARCH,
  );

    Some(log_path)
}

fn resolve_startup_log_path() -> PathBuf {
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        return PathBuf::from(local_app_data)
            .join(STARTUP_LOG_DIRECTORY_NAME)
            .join("logs")
            .join(STARTUP_LOG_FILE_NAME);
    }

    std::env::temp_dir()
        .join(STARTUP_LOG_DIRECTORY_NAME)
        .join("logs")
        .join(STARTUP_LOG_FILE_NAME)
}

fn ensure_pre_app_runtime_requirements() -> io::Result<()> {
    #[cfg(target_os = "windows")]
    {
        return ensure_windows_webview_runtime();
    }

    #[allow(unreachable_code)]
    Ok(())
}

#[cfg(target_os = "windows")]
fn ensure_windows_webview_runtime() -> io::Result<()> {
    if is_windows_webview2_installed() {
        return Ok(());
    }

    let Some(bootstrapper_path) = resolve_windows_webview_bootstrapper_path()? else {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Microsoft Edge WebView2 Runtime is required to start BaoBuildBuddy. Use the BaoBuildBuddy setup installer or place the bundled WebView2 bootstrapper under gen\\runtime\\bin next to the portable executable.",
        ));
    };

    let prompt = format!(
        "BaoBuildBuddy requires Microsoft Edge WebView2 Runtime to open the desktop app.\n\nSelect Yes to run the bundled installer now.\n\nInstaller: {}",
        bootstrapper_path.display()
    );
    let dialog_result = show_native_message_dialog(
        "Install WebView2 Runtime",
        prompt.as_str(),
        MessageLevel::Warning,
        MessageButtons::YesNo,
    );
    if dialog_result != MessageDialogResult::Yes {
        return Err(io::Error::new(
            io::ErrorKind::Interrupted,
            "Microsoft Edge WebView2 Runtime installation was declined.",
        ));
    }

    let install_status = Command::new(&bootstrapper_path).arg("/install").status()?;
    if !install_status.success() {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            format!(
                "Microsoft Edge WebView2 Runtime installer exited with {}",
                format_exit_status(&install_status)
            ),
        ));
    }

    if is_windows_webview2_installed() {
        return Ok(());
    }

    Err(io::Error::new(
        io::ErrorKind::Other,
        "Microsoft Edge WebView2 Runtime is still unavailable after the bundled installer completed.",
    ))
}

#[cfg(target_os = "windows")]
fn resolve_windows_webview_bootstrapper_path() -> io::Result<Option<PathBuf>> {
    let Some(runtime_root) = resolve_current_executable_runtime_root()? else {
        return Ok(None);
    };

    let manifest_path = runtime_root.join("manifest.json");
    let manifest_text = fs::read_to_string(&manifest_path)?;
    let manifest =
        serde_json::from_str::<PackagedRuntimeManifest>(&manifest_text).map_err(|error| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Unable to parse desktop runtime manifest: {error}"),
            )
        })?;
    let Some(relative_path) = manifest.webview_bootstrapper_executable else {
        return Ok(None);
    };

    let bootstrapper_path = runtime_root.join(relative_path);
    Ok(bootstrapper_path.exists().then_some(bootstrapper_path))
}

#[cfg(target_os = "windows")]
fn resolve_current_executable_runtime_root() -> io::Result<Option<PathBuf>> {
    let current_executable = std::env::current_exe()?;
    let Some(executable_dir) = current_executable.parent() else {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "Current executable path did not contain a parent directory.",
        ));
    };

    let runtime_root = executable_dir.join("gen").join("runtime");
    Ok(runtime_root
        .join("manifest.json")
        .exists()
        .then_some(runtime_root))
}

#[cfg(target_os = "windows")]
fn is_windows_webview2_installed() -> bool {
    let registry_keys = [
        format!(
            r"HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{}",
            WINDOWS_WEBVIEW2_APP_GUID
        ),
        format!(
            r"HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{}",
            WINDOWS_WEBVIEW2_APP_GUID
        ),
        format!(
            r"HKCU\SOFTWARE\Microsoft\EdgeUpdate\Clients\{}",
            WINDOWS_WEBVIEW2_APP_GUID
        ),
    ];

    registry_keys
        .iter()
        .filter_map(|registry_key| query_windows_registry_value(registry_key.as_str(), "pv").ok())
        .any(|value| !value.trim().is_empty())
}

#[cfg(target_os = "windows")]
fn query_windows_registry_value(registry_key: &str, value_name: &str) -> io::Result<String> {
    let output = Command::new("reg")
        .args(["query", registry_key, "/v", value_name])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()?;

    if !output.status.success() {
        return Ok(String::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .find_map(|line| parse_windows_registry_value_line(line, value_name))
        .unwrap_or_default())
}

#[cfg(target_os = "windows")]
fn parse_windows_registry_value_line(line: &str, value_name: &str) -> Option<String> {
    let trimmed = line.trim();
    if !trimmed.starts_with(value_name) {
        return None;
    }

    let columns = trimmed.split_whitespace().collect::<Vec<_>>();
    if columns.len() < 3 {
        return None;
    }

    Some(columns[2..].join(" "))
}

fn resolve_runtime_mode(app: &tauri::App) -> io::Result<RuntimeMode> {
    if let Some(runtime) = resolve_packaged_runtime(app)? {
        return Ok(RuntimeMode::Packaged(runtime));
    }

    resolve_workspace_root().map(RuntimeMode::Workspace)
}

fn resolve_packaged_runtime(app: &tauri::App) -> io::Result<Option<PackagedRuntime>> {
    let manifest_path = app
        .path()
        .resolve(RUNTIME_MANIFEST_RESOURCE_PATH, BaseDirectory::Resource)
        .map_err(|error| {
            io::Error::new(
                io::ErrorKind::Other,
                format!("Unable to resolve desktop runtime manifest path: {error}"),
            )
        })?;

    if !manifest_path.exists() {
        return Ok(None);
    }

    let manifest_text = fs::read_to_string(&manifest_path)?;
    let manifest =
        serde_json::from_str::<PackagedRuntimeManifest>(&manifest_text).map_err(|error| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Unable to parse desktop runtime manifest: {error}"),
            )
        })?;

    let runtime_root = manifest_path.parent().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            "Desktop runtime manifest path did not contain a parent directory.",
        )
    })?;

    Ok(Some(PackagedRuntime {
        root: runtime_root.to_path_buf(),
        manifest,
    }))
}

fn resolve_workspace_root() -> io::Result<PathBuf> {
    if let Ok(manual_root) = std::env::var("BAO_WORKSPACE_ROOT") {
        return Ok(PathBuf::from(manual_root));
    }

    let manifest_root = Path::new(env!("CARGO_MANIFEST_DIR"));
    for ancestor in manifest_root.ancestors() {
        if is_workspace_root(ancestor) {
            return Ok(ancestor.to_path_buf());
        }
    }

    let cwd = std::env::current_dir()?;
    if is_workspace_root(&cwd) {
        return Ok(cwd);
    }

    Err(io::Error::new(
        io::ErrorKind::NotFound,
        "Could not locate repository workspace root. Set BAO_WORKSPACE_ROOT to your checkout path.",
    ))
}

fn is_workspace_root(path: &Path) -> bool {
    path.join("package.json").exists() && path.join("packages").is_dir()
}

fn ensure_stack_running(
    workspace_root: &Path,
    startup: &StackStartup,
) -> io::Result<Option<Child>> {
    if are_services_ready(startup) {
        return Ok(None);
    }

    println!("Starting local stack from {}", workspace_root.display());
    launch_bun_stack(workspace_root, startup).map(Some)
}

fn ensure_packaged_server_running(runtime: &PackagedRuntime) -> io::Result<Option<Child>> {
    if is_service_ready_with_address(
        runtime.manifest.server_host.as_str(),
        runtime.manifest.server_port,
    ) {
        return Ok(None);
    }

    println!(
        "Starting packaged desktop server from {}",
        runtime.root.display()
    );
    launch_packaged_server(runtime).map(Some)
}

fn terminate_child(child: &mut Child) {
    if let Err(error) = child.kill() {
        if error.kind() != io::ErrorKind::InvalidInput {
            eprintln!("Failed to stop startup child process: {error}");
        }
    }

    let _ = child.wait();
}

fn launch_bun_stack(workspace_root: &Path, startup: &StackStartup) -> io::Result<Child> {
    let command = std::env::var("BAO_STACK_BOOTSTRAP_COMMAND")
        .unwrap_or_else(|_| DEFAULT_BOOTSTRAP_COMMAND.to_string());

    let mut command = Command::new(command);
    command
        .args(["run", "dev"])
        .current_dir(workspace_root)
        .env("PORT", startup.server_port.to_string())
        .env("HOST", startup.host.as_str())
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    if let Ok(auth_override) = std::env::var("BAO_DISABLE_AUTH") {
        command.env("BAO_DISABLE_AUTH", auth_override);
    }

    command.spawn()
}

fn launch_packaged_server(runtime: &PackagedRuntime) -> io::Result<Child> {
    let server_path = runtime
        .root
        .join(runtime.manifest.server_executable.as_str());
    let script_runner_path = runtime
        .root
        .join(runtime.manifest.script_runner_executable.as_str());
    let scraper_dir = runtime.root.join(runtime.manifest.scraper_dir.as_str());

    if !server_path.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!(
                "Bundled desktop server executable was not found at {}",
                server_path.display()
            ),
        ));
    }

    if !script_runner_path.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!(
                "Bundled desktop Bun script runner was not found at {}",
                script_runner_path.display()
            ),
        ));
    }

    if !scraper_dir.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!(
                "Bundled desktop scraper runtime was not found at {}",
                scraper_dir.display()
            ),
        ));
    }

    let mut command = Command::new(server_path);
    command
        .current_dir(runtime.root.as_path())
        .env("PORT", runtime.manifest.server_port.to_string())
        .env("HOST", runtime.manifest.server_host.as_str())
        .env("NODE_ENV", "production")
        .env("BAO_SCRIPT_RUNNER_PATH", script_runner_path)
        .env("BAO_SCRAPER_DIR", scraper_dir)
        .env("CORS_ORIGINS", runtime.manifest.cors_origins.join(","))
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    // Auth stays enabled by default for packaged desktop. Opt out only via explicit env.
    if let Ok(auth_override) = std::env::var("BAO_DISABLE_AUTH") {
        command.env("BAO_DISABLE_AUTH", auth_override);
    }
    if let Ok(setup_token) = std::env::var("BAO_AUTH_SETUP_TOKEN") {
        command.env("BAO_AUTH_SETUP_TOKEN", setup_token);
    }

    if let Some(script_runner_entrypoint) = runtime.manifest.script_runner_entrypoint.as_ref() {
        command.env(
            "BAO_SCRIPT_RUNNER_ENTRYPOINT_PATH",
            runtime.root.join(script_runner_entrypoint),
        );
    }

    configure_background_process(&mut command);
    command.spawn()
}

#[cfg(target_os = "windows")]
fn format_exit_status(status: &ExitStatus) -> String {
    match status.code() {
        Some(code) => format!("status code {code}"),
        None => "an unknown termination signal".to_string(),
    }
}

fn configure_background_process(command: &mut Command) {
    #[cfg(target_os = "windows")]
    {
        command.creation_flags(WINDOWS_CREATE_NO_WINDOW_FLAG);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = command;
    }
}

fn read_env_u16(key: &str, fallback: u16) -> io::Result<u16> {
    match std::env::var(key) {
        Ok(value) => value.parse::<u16>().map_err(|_| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("Invalid {key} value: {value}"),
            )
        }),
        Err(_) => Ok(fallback),
    }
}
