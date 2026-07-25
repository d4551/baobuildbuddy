use std::io;
use std::process::Child;
use std::sync::{Arc, Mutex};

#[derive(Default)]
pub struct ProcessManager {
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
