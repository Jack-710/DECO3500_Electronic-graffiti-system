// WebSocket 连接
let ws;
let clientId;
let sessionId;
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 5;

// Canvas 设置
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

// 初始化 Canvas 大小
function resizeCanvas() {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // 保存当前画布内容（仅在已有内容时）
  let imageData = null;
  if (canvas.width > 0 && canvas.height > 0) {
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      // 忽略错误
    }
  }
  
  // 设置 canvas 尺寸
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  // 填充白色背景
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 恢复画布内容
  if (imageData) {
    ctx.putImageData(imageData, 0, 0);
  }
  
  // 设置默认样式
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

// 初始化
window.addEventListener('load', () => {
  resizeCanvas();
  setupEventListeners();
  connectWebSocket();
});

// 防止频繁触发
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeCanvas, 100);
});

// WebSocket 连接
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    showToast('✅ Connected to server');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };

  ws.onclose = () => {
    showToast('❌ Connection lost, reconnecting...');
    setTimeout(connectWebSocket, 2000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    showToast('⚠️ Connection error');
  };
}

// 处理 WebSocket 消息
function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'connected':
      clientId = data.clientId;
      sessionId = data.sessionId;
      updateOnlineCount(data.onlineUsers);
      break;

    case 'history':
      // 重放历史绘画动作
      setTimeout(() => {
        data.actions.forEach(action => {
          if (action.type === 'draw') {
            drawLine(action.data, false);
          } else if (action.type === 'clear') {
            clearCanvas(false);
          }
        });
      }, 100); // 延迟加载，确保 canvas 已初始化
      break;

    case 'draw':
      // 其他用户的绘画
      drawLine(data, false);
      break;

    case 'clear':
      clearCanvas(false);
      break;

    case 'user_left':
      updateOnlineCount(data.onlineUsers);
      break;
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 工具选择
  document.getElementById('brushTool').addEventListener('click', () => {
    selectTool('brush');
  });

  document.getElementById('eraserTool').addEventListener('click', () => {
    selectTool('eraser');
  });

  // 笔刷大小
  document.querySelectorAll('.size-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      document.querySelectorAll('.size-dot').forEach(d => d.classList.remove('active'));
      e.target.classList.add('active');
      currentSize = parseInt(e.target.dataset.size);
    });
  });

  // 颜色选择
  const colorPicker = document.getElementById('colorPicker');
  colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    updateColorIndicator(currentColor);
    if (currentTool === 'eraser') {
      selectTool('brush');
    }
  });

  // 清空画布
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas? This will affect all users.')) {
      clearCanvas(true);
    }
  });

  // 撤销功能
  document.getElementById('undoBtn').addEventListener('click', () => {
    showToast('Undo feature in development...');
  });

  // 上传/保存
  document.getElementById('uploadBtn').addEventListener('click', () => {
    saveDrawing();
  });

  // 分享
  document.getElementById('shareBtn').addEventListener('click', () => {
    showToast(`🔗 Share link: ${window.location.href}`);
  });

  // Canvas 绘画事件
  setupCanvasEvents();
}

// 设置 Canvas 绘画事件
function setupCanvasEvents() {
  let lastX = 0;
  let lastY = 0;

  // 获取坐标的辅助函数
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const coords = getCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const drawData = {
      type: 'draw',
      startX: lastX,
      startY: lastY,
      endX: coords.x,
      endY: coords.y,
      color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
      size: currentTool === 'eraser' ? currentSize * 3 : currentSize,
      tool: currentTool
    };

    // 本地绘制
    drawLine(drawData, false);

    // 发送给服务器
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(drawData));
    }

    lastX = coords.x;
    lastY = coords.y;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // 鼠标事件
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // 触摸事件
  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);
}

// 绘制线条
function drawLine(data, broadcast = true) {
  ctx.beginPath();
  ctx.strokeStyle = data.color;
  ctx.lineWidth = data.size;
  ctx.moveTo(data.startX, data.startY);
  ctx.lineTo(data.endX, data.endY);
  ctx.stroke();
}

// 清空画布
function clearCanvas(broadcast = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (broadcast && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'clear' }));
  }
}

// 选择工具
function selectTool(tool) {
  currentTool = tool;
  
  document.querySelectorAll('.tool-icon').forEach(btn => {
    btn.classList.remove('active');
  });

  if (tool === 'brush') {
    document.getElementById('brushTool').classList.add('active');
  } else if (tool === 'eraser') {
    document.getElementById('eraserTool').classList.add('active');
  }
}

// 更新颜色指示器
function updateColorIndicator(color) {
  const indicator = document.getElementById('colorIndicator');
  indicator.style.backgroundColor = color;
}

// 更新在线人数
function updateOnlineCount(count) {
  document.getElementById('onlineCount').textContent = count;
}

// 保存绘画
function saveDrawing() {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Image saved');
  });
}

// 显示提示
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// 初始化颜色指示器
updateColorIndicator(currentColor);

