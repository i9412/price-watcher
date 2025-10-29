// === Price Spread Watcher - Chrome 插件内容脚本 ===
(function () {
  console.log("✅ Price Spread Watcher 插件已加载");

  let alertBox = document.createElement("div");
  Object.assign(alertBox.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "10px 20px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "10px",
    color: "#fff",
    zIndex: 999999,
    transition: "background-color 0.3s ease",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    cursor: "move",
    userSelect: "none"
  });
  alertBox.textContent = "监控启动中...";
  document.body.appendChild(alertBox);

  let monitoring = true;
  let lastStatus = null;

  // === 拖动逻辑 ===
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  alertBox.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - alertBox.getBoundingClientRect().left;
    offsetY = e.clientY - alertBox.getBoundingClientRect().top;
    alertBox.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    alertBox.style.left = e.clientX - offsetX + "px";
    alertBox.style.top = e.clientY - offsetY + "px";
    alertBox.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    alertBox.style.transition = "background-color 0.3s ease";
  });

  // 双击暂停
  alertBox.addEventListener("dblclick", () => {
    monitoring = !monitoring;
    alertBox.style.backgroundColor = monitoring ? "#007bff" : "#555";
    alertBox.textContent = monitoring ? "监控中 (双击暂停)" : "已暂停 (双击恢复)";
  });

  // 播放提示音
  function playBeep(frequency = 440, duration = 150) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  // 抓成交价
  function findPrices() {
    const divs = document.querySelectorAll(
      ".ReactVirtualized__Grid__innerScrollContainer div.justify-between div.cursor-pointer"
    );
    const prices = [];
    divs.forEach((div) => {
      const val = parseFloat((div.textContent || "").trim());
      if (!isNaN(val)) prices.push(val);
    });
    return prices;
  }

  // 更新监控逻辑
  function checkSpread() {
    if (!monitoring) return;
    const prices = findPrices();

    if (prices.length === 0) {
      alertBox.style.backgroundColor = "#555";
      alertBox.textContent = "暂无成交数据...";
      return;
    }

    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const spread = ((max - min) / min) * 100;
    const status = spread > 0.01 ? "high" : "low";

    alertBox.textContent = `价差：${spread.toFixed(4)}%（高:${max.toFixed(6)} 低:${min.toFixed(6)}）`;
    alertBox.style.backgroundColor = status === "high" ? "red" : "green";

    if (lastStatus && lastStatus !== status) {
      playBeep(status === "high" ? 800 : 400, 200);
    }

    lastStatus = status;
  }

  setInterval(checkSpread, 500);

  const container = document.querySelector(".ReactVirtualized__Grid__innerScrollContainer");
  if (container) {
    const observer = new MutationObserver(checkSpread);
    observer.observe(container, { childList: true, subtree: true });
  }
})();