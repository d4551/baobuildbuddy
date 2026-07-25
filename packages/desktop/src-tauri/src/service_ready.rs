use std::io;
use std::net::TcpStream;
use std::process::{Child, ExitStatus};
use std::time::{Duration, Instant};

const READY_TIMEOUT_SECONDS: u64 = 120;
const READY_POLL_INTERVAL_MS: u64 = 250;

#[cfg(target_os = "windows")]
const WINDOWS_BAD_IMAGE_FORMAT_EXIT_CODE: i32 = -1073741701;
#[cfg(target_os = "windows")]
const WINDOWS_DLL_NOT_FOUND_EXIT_CODE: i32 = -1073741515;
#[cfg(target_os = "windows")]
const WINDOWS_ILLEGAL_INSTRUCTION_EXIT_CODE: i32 = -1073741795;

pub trait ServiceEndpoints {
    fn host(&self) -> &str;
    fn server_port(&self) -> u16;
    fn client_port(&self) -> u16;
}

pub fn wait_for_services(startup: &impl ServiceEndpoints) -> io::Result<()> {
    wait_for_service_port(startup.host(), startup.server_port())?;
    wait_for_service_port(startup.host(), startup.client_port())
}

pub fn are_services_ready(startup: &impl ServiceEndpoints) -> bool {
    is_service_ready_with_address(startup.host(), startup.server_port())
        && is_service_ready_with_address(startup.host(), startup.client_port())
}

pub fn wait_for_service_port(host: &str, port: u16) -> io::Result<()> {
    let end_time = Instant::now() + Duration::from_secs(READY_TIMEOUT_SECONDS);

    while Instant::now() < end_time {
        if is_service_ready_with_address(host, port) {
            return Ok(());
        }

        std::thread::sleep(Duration::from_millis(READY_POLL_INTERVAL_MS));
    }

    Err(io::Error::new(
        io::ErrorKind::TimedOut,
        format!("Timed out waiting for service on {host}:{port}"),
    ))
}

pub fn wait_for_service_port_or_process_exit(
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

        std::thread::sleep(Duration::from_millis(READY_POLL_INTERVAL_MS));
    }

    Err(io::Error::new(
        io::ErrorKind::TimedOut,
        format!("Timed out waiting for service on {host}:{port}"),
    ))
}

pub fn is_service_ready_with_address(host: &str, port: u16) -> bool {
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

#[cfg(target_os = "windows")]
fn windows_exit_hint(code: i32) -> Option<&'static str> {
    match code {
        WINDOWS_BAD_IMAGE_FORMAT_EXIT_CODE => Some(
            "Windows reported a bad image format (often a 32-bit/64-bit architecture mismatch).",
        ),
        WINDOWS_DLL_NOT_FOUND_EXIT_CODE => {
            Some("Windows could not find a required DLL for the bundled server executable.")
        }
        WINDOWS_ILLEGAL_INSTRUCTION_EXIT_CODE => {
            Some("Windows reported an illegal instruction while starting the bundled server.")
        }
        _ => None,
    }
}

#[cfg(not(target_os = "windows"))]
fn windows_exit_hint(_code: i32) -> Option<&'static str> {
    None
}
