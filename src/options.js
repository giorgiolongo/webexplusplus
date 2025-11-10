function saveOptions() {
  const autohideEl = document.getElementById("autohide-sidebar");
  const data = {};
  if (autohideEl) data.autohideSidebar = autohideEl.checked;
  if (Object.keys(data).length > 0) {
    chrome.storage.local.set(data);
  }
}

function restoreOptions() {
  function setCurrentChoice(result) {
    // autohide checkbox; default to true when key is absent
    const autohideEl = document.getElementById("autohide-sidebar");
    if (autohideEl) {
      autohideEl.checked = (result.autohideSidebar === undefined) ? true : !!result.autohideSidebar;
    }
  }

  chrome.storage.local.get(["autohideSidebar"], setCurrentChoice);
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  const autohideEl = document.getElementById("autohide-sidebar");
  if (autohideEl) autohideEl.addEventListener("click", saveOptions);
});
