function saveOptions() {
  const hideEl   = document.getElementById("hide-useless-elements");
  const persistEl = document.getElementById("persist-media-settings");
  const data = {};
  if (hideEl)    data.hideUselessElements  = hideEl.checked;
  if (persistEl) data.persistMediaSettings = persistEl.checked;
  if (Object.keys(data).length > 0) chrome.storage.local.set(data);
}

function restoreOptions() {
  chrome.storage.local.get(["hideUselessElements", "persistMediaSettings"], (result) => {
    const hideEl = document.getElementById("hide-useless-elements");
    if (hideEl) hideEl.checked = (result.hideUselessElements === undefined) ? true : !!result.hideUselessElements;

    const persistEl = document.getElementById("persist-media-settings");
    if (persistEl) persistEl.checked = (result.persistMediaSettings === undefined) ? true : !!result.persistMediaSettings;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  ["hide-useless-elements", "persist-media-settings"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", saveOptions);
  });
});
