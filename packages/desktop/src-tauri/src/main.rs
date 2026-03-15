#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use serde::Deserialize;
use tauri::path::BaseDirectory;
use tauri::{Manager, RunEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_SERVER_PORT: u16 = 3000;
const DEFAULT_CLIENT_PORT: u16 = 3001;
const DEFAULT_BOOTSTRAP_COMMAND: &str = "bun";
const READY_TIMEOUT_SECONDS: u64 = 120;
const RUNTIME_MANIFEST_RESOURCE_PATH: &str = "gen/runtime/manifest.json";
const STARTUP_LOG_DIRECTORY_NAME: &str = "BaoBuildBuddy";
const STARTUP_LOG_FILE_NAME: &str = "desktop-startup.log";
const WINDOWS_BAD_IMAGE_FORMAT_EXIT_CODE: i32 = -1073741701;
#[cfg(target_os = "windows")]
const WINDOWS_CREATE_NO_WINDOW_FLAG: u32 = 0x08000000;
const WINDOWS_DLL_NOT_FOUND_EXIT_CODE: i32 = -1073741515;
const WINDOWS_ILLEGAL_INSTRUCTION_EXIT_CODE: i32 = -1073741795;

#[derive(Default)]
struct ProcessManager {
    child: Arc<Mutex<Option<Child>>>,
}

impl ProcessManager {
    pub fn set_child(&self, child: Child) {
        let mut guard = match self.child.lock() {
            Ok(guard) => guard,
            Err(error) => {
                eprintln!("Unable to track local stack process: {error}");
                return;
            }
        };

        *guard = Some(child);
    }

    pub fn shutdown(&self) {
        let Some(mut child) = self.take_child() else {
            return;
        };

        if let Err(error) = child.kill() {
            if error.kind() != io::ErrorKind::InvalidInput {
                eprintln!("Failed to stop stack process: {error}");
            }
        }

        let _ = child.wait();
    }

    fn take_child(&self) -> Option<Child> {
        let mut guard = match self.child.lock() {
            Ok(guard) => guard,
            Err(error) => {
                eprintln!("Unable to access local stack process handle: {error}");
                return None;
            }
        };

        guard.take()
    }
}

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

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackagedRuntimeManifest {
    server_executable: String,
    script_runner_executable: String,
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
            let message = format!("BaoBuildBuddy desktop wrapper failed to initialize: {error}");
            let log_path = write_startup_log("builder failure", message.as_str());
            eprintln!("{message}");
            if let Some(path) = log_path {
                eprintln!("Startup log: {}", path.display());
            }
            return;
        }
    };

    app.run(|app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            app_handle.state::<ProcessManager>().shutdown();
        }
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
                "BaoBuildBuddy desktop wrapper: bundled ui active, server on http://{}:{}",
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
                "BaoBuildBuddy desktop wrapper: server on http://{}:{}, ui on http://{}:{}",
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
        .env("BAO_DISABLE_AUTH", "true")
        .env("BAO_SCRIPT_RUNNER_PATH", script_runner_path)
        .env("BAO_SCRAPER_DIR", scraper_dir)
        .env("CORS_ORIGINS", runtime.manifest.cors_origins.join(","))
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    configure_background_process(&mut command);
    command.spawn()
}

fn wait_for_services(startup: &StackStartup) -> io::Result<()> {
    wait_for_service_port(startup.host.as_str(), startup.server_port)?;
    wait_for_service_port(startup.host.as_str(), startup.client_port)
}

fn are_services_ready(startup: &StackStartup) -> bool {
    is_service_ready_with_address(startup.host.as_str(), startup.server_port)
        && is_service_ready_with_address(startup.host.as_str(), startup.client_port)
}

fn wait_for_service_port(host: &str, port: u16) -> io::Result<()> {
    let end_time = Instant::now() + Duration::from_secs(READY_TIMEOUT_SECONDS);

    while Instant::now() < end_time {
        if is_service_ready_with_address(host, port) {
            return Ok(());
        }

        std::thread::sleep(Duration::from_millis(250));
    }

    Err(io::Error::new(
        io::ErrorKind::TimedOut,
        format!("Timed out waiting for service on {host}:{port}"),
    ))
}

fn wait_for_service_port_or_process_exit(
    host: &str,
    port: u16,
    child: &mut Child,
) -> io::Result<()> {
    let end_time = Instant::now() + Duration::from_secs(READY_TIMEOUT_SECONDS);

    while Instant::now() < end_time {
        if is_service_ready_with_address(host, port) {
            return Ok(());
        }

        if let Some(status) = child.try_wait()? {
            let status_message = format_exit_status(&status);
            let exit_hint = format_exit_hint(&status);
            return Err(io::Error::new(
                io::ErrorKind::BrokenPipe,
                format!(
                    "Bundled desktop server exited before opening {host}:{port} with {}{}",
                    status_message, exit_hint,
                ),
            ));
        }

        std::thread::sleep(Duration::from_millis(250));
    }

    Err(io::Error::new(
        io::ErrorKind::TimedOut,
        format!("Timed out waiting for service on {host}:{port}"),
    ))
}

fn is_service_ready_with_address(host: &str, port: u16) -> bool {
    match TcpStream::connect(format!("{host}:{port}")) {
        Ok(stream) => {
            drop(stream);
            true
        }
        Err(_) => false,
    }
}

fn format_exit_status(status: &ExitStatus) -> String {
    match status.code() {
        Some(code) => format!("status code {code}"),
        None => "an unknown termination signal".to_string(),
    }
}

fn format_exit_hint(status: &ExitStatus) -> String {
    match status.code().and_then(windows_exit_hint) {
        Some(hint) => format!(". {hint}"),
        None => String::new(),
    }
}

fn windows_exit_hint(code: i32) -> Option<&'static str> {
    match code {
    WINDOWS_BAD_IMAGE_FORMAT_EXIT_CODE => Some(
      "Windows reported an invalid image format. This usually points to an architecture mismatch or a corrupted dependency.",
    ),
    WINDOWS_DLL_NOT_FOUND_EXIT_CODE => Some(
      "Windows reported a missing runtime dependency. Antivirus or a blocked system dependency can cause this.",
    ),
    WINDOWS_ILLEGAL_INSTRUCTION_EXIT_CODE => Some(
      "Windows reported an illegal instruction. This usually means the bundled runtime required CPU features the machine does not support.",
    ),
    _ => None,
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
