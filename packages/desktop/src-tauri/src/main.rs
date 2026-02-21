#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use tauri::{Manager, RunEvent};

const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_SERVER_PORT: u16 = 3000;
const DEFAULT_CLIENT_PORT: u16 = 3001;
const DEFAULT_BOOTSTRAP_COMMAND: &str = "bun";
const READY_TIMEOUT_SECONDS: u64 = 120;

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
      client_port: read_env_u16("CLIENT_PORT", DEFAULT_CLIENT_PORT).unwrap_or(DEFAULT_CLIENT_PORT),
    }
  }
}

fn main() {
  let manager = ProcessManager::default();

  let app = tauri::Builder::default()
    .manage(manager)
    .setup(move |app| {
      let workspace_root = resolve_workspace_root()?;
      let startup = StackStartup::from_env();

      if let Some(child) = ensure_stack_running(&workspace_root, &startup)? {
        app.state::<ProcessManager>().set_child(child);
      }

      wait_for_services(&startup)?;
      println!(
        "BaoBuildBuddy desktop wrapper: server on http://{}:{}, ui on http://{}:{}",
        startup.host, startup.server_port, startup.host, startup.client_port
      );

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building app");

  app.run(|app_handle, event| {
    if let RunEvent::ExitRequested { .. } = event {
      app_handle.state::<ProcessManager>().shutdown();
    }
  });
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

fn ensure_stack_running(workspace_root: &Path, startup: &StackStartup) -> io::Result<Option<Child>> {
  if are_services_ready(startup) {
    return Ok(None);
  }

  println!("Starting local stack from {}", workspace_root.display());
  launch_bun_stack(workspace_root, startup).map(Some)
}

fn launch_bun_stack(workspace_root: &Path, startup: &StackStartup) -> io::Result<Child> {
  let command = std::env::var("BAO_STACK_BOOTSTRAP_COMMAND").unwrap_or_else(|_| DEFAULT_BOOTSTRAP_COMMAND.to_string());

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

fn is_service_ready_with_address(host: &str, port: u16) -> bool {
  match TcpStream::connect(format!("{host}:{port}")) {
    Ok(stream) => {
      drop(stream);
      true
    }
    Err(_) => false,
  }
}

fn read_env_u16(key: &str, fallback: u16) -> io::Result<u16> {
  match std::env::var(key) {
    Ok(value) => value
      .parse::<u16>()
      .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, format!("Invalid {key} value: {value}"))),
    Err(_) => Ok(fallback),
  }
}
