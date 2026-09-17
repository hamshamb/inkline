#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // Save-file dialog + writing the chosen file: the only native
    // filesystem access this app uses, and only ever to a path the user
    // explicitly picks via the native "Save As" dialog (see
    // src/export/download.ts's Tauri adapter). No other filesystem or
    // network capability is registered.
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
