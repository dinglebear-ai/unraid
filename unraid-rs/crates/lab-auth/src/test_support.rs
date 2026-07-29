use std::io;
use std::sync::{Arc, Mutex};

use tracing_subscriber::fmt::MakeWriter;

#[derive(Clone, Default)]
pub struct SharedBuf(Arc<Mutex<Vec<u8>>>);

impl<'a> MakeWriter<'a> for SharedBuf {
    type Writer = SharedWriter;

    fn make_writer(&'a self) -> Self::Writer {
        SharedWriter(Arc::clone(&self.0))
    }
}

pub struct SharedWriter(Arc<Mutex<Vec<u8>>>);

impl io::Write for SharedWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.0
            .lock()
            .expect("capture buffer lock")
            .extend_from_slice(buf);
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

pub fn captured_logs(buf: &SharedBuf) -> String {
    String::from_utf8(buf.0.lock().expect("capture buffer lock").clone())
        .expect("captured logs are utf-8")
}

pub static TRACING_TEST_LOCK: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
