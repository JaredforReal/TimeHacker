<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { apiClient } from '../api';

// 状态变量
const timerState = ref('stopped'); // 'running', 'paused', 'stopped'
const timeLeft = ref(25 * 60); // 默认25分钟，以秒为单位
const currentMode = ref('work'); // 'work', 'break'
const isLoading = ref(false);
const error = ref(null);
const timerHistory = ref([]);
const timerInterval = ref(null);
const showSettings = ref(false);

// 设置（可让用户自定义）
const settings = ref({
  workTime: 25, // 工作时间（分钟）
  shortBreakTime: 5, // 短休息时间（分钟）
  longBreakTime: 15, // 长休息时间（分钟）
  sessionsUntilLongBreak: 4, // 长休息前的工作次数
});

// 编辑设置的临时变量
const editSettings = ref({...settings.value});

const sessionsCompleted = ref(0);
const timerTitle = ref(''); // 当前任务标题

// 计算属性
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const progress = computed(() => {
  const totalTime = currentMode.value === 'work' 
    ? settings.value.workTime * 60
    : (currentMode.value === 'shortBreak' 
      ? settings.value.shortBreakTime * 60 
      : settings.value.longBreakTime * 60);
  
  return ((totalTime - timeLeft.value) / totalTime) * 100;
});

// 方法
const startTimer = () => {
  if (!timerTitle.value.trim() && currentMode.value === 'work') {
    error.value = '请输入任务标题';
    setTimeout(() => {
      error.value = null;
    }, 3000);
    return;
  }

  timerState.value = 'running';
  
  // 清除现有的interval以防止重复
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
  
  // 创建新的计时器
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      handleTimerComplete();
    }
  }, 1000);
};

const pauseTimer = () => {
  timerState.value = 'paused';
  clearInterval(timerInterval.value);
};

const resetTimer = () => {
  timerState.value = 'stopped';
  clearInterval(timerInterval.value);
  
  // 根据当前模式重置时间
  if (currentMode.value === 'work') {
    timeLeft.value = settings.value.workTime * 60;
  } else if (currentMode.value === 'shortBreak') {
    timeLeft.value = settings.value.shortBreakTime * 60;
  } else {
    timeLeft.value = settings.value.longBreakTime * 60;
  }
};

const handleTimerComplete = async () => {
  // 播放提示音效
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play();
  
  clearInterval(timerInterval.value);
  
  // 如果是工作模式完成，记录到历史并保存到数据库
  if (currentMode.value === 'work') {
    const session = {
      title: timerTitle.value,
      duration: settings.value.workTime,
      completedAt: new Date().toISOString()
    };
    
    timerHistory.value.unshift(session);
    sessionsCompleted.value++;
    
    // 保存到数据库
    try {
      await saveSession(session);
    } catch (err) {
      error.value = `保存失败: ${err.message}`;
      setTimeout(() => { error.value = null; }, 5000);
    }
    
    // 切换到休息模式
    if (sessionsCompleted.value % settings.value.sessionsUntilLongBreak === 0) {
      currentMode.value = 'longBreak';
      timeLeft.value = settings.value.longBreakTime * 60;
    } else {
      currentMode.value = 'shortBreak';
      timeLeft.value = settings.value.shortBreakTime * 60;
    }
  } else {
    // 从休息模式完成后，切换回工作模式
    currentMode.value = 'work';
    timeLeft.value = settings.value.workTime * 60;
    timerTitle.value = '';
  }
  
  timerState.value = 'stopped';
};

// 数据库操作
const saveSession = async (session) => {
  try {
    isLoading.value = true;
    await apiClient.savePomodoro(session);
  } finally {
    isLoading.value = false;
  }
};

const loadHistory = async () => {
  try {
    isLoading.value = true;
    const history = await apiClient.getPomodoroHistory();
    timerHistory.value = history;
  } catch (err) {
    error.value = `加载历史记录失败: ${err.message}`;
    setTimeout(() => { error.value = null; }, 5000);
  } finally {
    isLoading.value = false;
  }
};

// 加载用户设置
const loadSettings = async () => {
  try {
    isLoading.value = true;
    const userSettings = await apiClient.getPomodoroSettings();
    if (userSettings) {
      settings.value = userSettings;
      // 根据当前模式更新剩余时间
      if (timerState.value === 'stopped') {
        resetTimer();
      }
    }
  } catch (err) {
    error.value = `加载设置失败: ${err.message}`;
    setTimeout(() => { error.value = null; }, 5000);
  } finally {
    isLoading.value = false;
  }
};

// 保存用户设置
const saveSettings = async () => {
  try {
    isLoading.value = true;
    
    // 验证输入的值
    if (editSettings.value.workTime < 1 || editSettings.value.shortBreakTime < 1 || 
        editSettings.value.longBreakTime < 1 || editSettings.value.sessionsUntilLongBreak < 1) {
      error.value = '所有设置值必须大于0';
      setTimeout(() => { error.value = null; }, 5000);
      return;
    }
    
    // 保存到后端
    await apiClient.savePomodoroSettings(editSettings.value);
    
    // 更新本地设置
    settings.value = {...editSettings.value};
    
    // 如果计时器未运行，则重置当前计时器以应用新设置
    if (timerState.value === 'stopped') {
      resetTimer();
    }
    
    // 关闭设置面板
    showSettings.value = false;
    
  } catch (err) {
    error.value = `保存设置失败: ${err.message}`;
    setTimeout(() => { error.value = null; }, 5000);
  } finally {
    isLoading.value = false;
  }
};

// 显示设置面板
const openSettings = () => {
  editSettings.value = {...settings.value};
  showSettings.value = true;
};

// 关闭设置面板
const closeSettings = () => {
  showSettings.value = false;
};

// 生命周期钩子
onMounted(() => {
  loadHistory();
  loadSettings();
});

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

// 切换模式（手动）
const switchMode = (mode) => {
  if (timerState.value !== 'stopped') {
    if (!confirm('计时器正在运行，确定要切换模式吗？')) {
      return;
    }
    clearInterval(timerInterval.value);
  }
  
  currentMode.value = mode;
  
  if (mode === 'work') {
    timeLeft.value = settings.value.workTime * 60;
  } else if (mode === 'shortBreak') {
    timeLeft.value = settings.value.shortBreakTime * 60;
  } else {
    timeLeft.value = settings.value.longBreakTime * 60;
  }
  
  timerState.value = 'stopped';
};
</script>

<template>
  <div class="pomodoro-container">
    <h2 class="section-title">
      番茄时钟
      <div class="header-controls">
        <button @click="openSettings" class="settings-btn" title="设置">
          ⚙️
        </button>
      </div>
    </h2>
      
      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- 设置面板 -->
      <div v-if="showSettings" class="settings-panel">
        <h3>定制你的番茄钟</h3>
        <div class="setting-item">
          <label>工作时间（分钟）</label>
          <input 
            type="number" 
            v-model.number="editSettings.workTime" 
            min="1" 
            max="120"
          />
        </div>
        <div class="setting-item">
          <label>短休息时间（分钟）</label>
          <input 
            type="number" 
            v-model.number="editSettings.shortBreakTime" 
            min="1" 
            max="30"
          />
        </div>
        <div class="setting-item">
          <label>长休息时间（分钟）</label>
          <input 
            type="number" 
            v-model.number="editSettings.longBreakTime" 
            min="1" 
            max="60"
          />
        </div>
        <div class="setting-item">
          <label>长休息间隔（番茄钟数）</label>
          <input 
            type="number" 
            v-model.number="editSettings.sessionsUntilLongBreak" 
            min="1" 
            max="10"
          />
        </div>
        <div class="settings-actions">
          <button @click="saveSettings" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? '保存中...' : '保存设置' }}
          </button>
          <button @click="closeSettings" class="btn btn-secondary">取消</button>
        </div>
      </div>
      
      <!-- 模式切换标签 -->
      <div class="mode-tabs" v-if="!showSettings">
        <button 
          @click="switchMode('work')" 
          :class="['mode-tab', currentMode === 'work' ? 'active' : '']"
        >
          工作
        </button>
        <button 
          @click="switchMode('shortBreak')" 
          :class="['mode-tab', currentMode === 'shortBreak' ? 'active' : '']"
        >
          短休息
        </button>
        <button 
          @click="switchMode('longBreak')" 
          :class="['mode-tab', currentMode === 'longBreak' ? 'active' : '']"
        >
          长休息
        </button>
      </div>
      
      <!-- 任务标题输入（仅工作模式显示） -->
      <div v-if="currentMode === 'work' && !showSettings" class="task-input">
        <input
          v-model="timerTitle"
          type="text"
          placeholder="你正在做什么？（必填）"
          :disabled="timerState !== 'stopped'"
        />
      </div>
      
      <!-- 计时器显示 -->
      <div class="timer-display" v-if="!showSettings">
        <div class="timer-circle" :style="`--progress: ${progress}%`">
          <div class="time">{{ formattedTime }}</div>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="timer-controls" v-if="!showSettings">
        <button 
          v-if="timerState === 'stopped'" 
          @click="startTimer" 
          class="btn btn-primary"
        >
          开始
        </button>
        <button 
          v-else-if="timerState === 'running'" 
          @click="pauseTimer" 
          class="btn btn-warning"
        >
          暂停
        </button>
        <button 
          v-else 
          @click="startTimer" 
          class="btn btn-primary"
        >
          继续
        </button>
        <button 
          v-if="timerState !== 'stopped'" 
          @click="resetTimer" 
          class="btn btn-secondary"
        >
          重置
        </button>
      </div>
      
      <!-- 进度指示 -->
      <div class="progress-container" v-if="!showSettings">
        <div class="progress-bar" :style="`width: ${progress}%`"></div>
      </div>
      
      <!-- 当前设置显示 -->
      <div class="current-settings" v-if="!showSettings">
        <div class="settings-info">
          <span>工作: {{ settings.workTime }}分钟</span>
          <span>短休息: {{ settings.shortBreakTime }}分钟</span>
          <span>长休息: {{ settings.longBreakTime }}分钟</span>
          <span>长休息间隔: {{ settings.sessionsUntilLongBreak }}个番茄钟</span>
        </div>
      </div>
      
      <!-- 会话历史 -->
      <div class="session-history" v-if="!showSettings">
        <h3>历史记录</h3>
        <div class="history-list">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            加载中...
          </div>
          <div v-else-if="timerHistory.length === 0" class="empty-history">
            暂无番茄钟记录
          </div>
          <div v-else class="history-item" v-for="(item, index) in timerHistory" :key="index">
            <div class="history-content">
              <span class="history-title">{{ item.title }}</span>
              <span class="history-time">{{ new Date(item.completedAt).toLocaleString() }}</span>
            </div>
            <span class="history-duration">{{ item.duration }} 分钟</span>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.pomodoro-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #757575;
  padding: 6px;
  transition: all 0.2s;
  border-radius: 4px;
}

.settings-btn:hover {
  color: #1e88e5;
  background-color: #f5f5f5;
  transform: rotate(30deg);
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.settings-panel {
  background: #f5f7f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.settings-panel h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.setting-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.setting-item label {
  margin-bottom: 5px;
  font-weight: 500;
}

.setting-item input {
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.current-settings {
  margin: 15px 0;
  padding: 10px;
  background: #f5f7f9;
  border-radius: 6px;
  font-size: 14px;
}

.settings-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.settings-info span {
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.mode-tab {
  padding: 8px 16px;
  border-radius: 20px;
  background: #f1f3f5;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-tab.active {
  background: #1e88e5;
  color: white;
}

.task-input {
  margin-bottom: 20px;
}

.task-input input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 16px;
}

.task-input input:focus {
  outline: none;
  border-color: #90caf9;
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
}

.timer-display {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    #1e88e5 0% var(--progress), 
    #f0f9ff var(--progress) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.timer-circle::before {
  content: '';
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: white;
}

.time {
  position: relative;
  z-index: 1;
  font-size: 36px;
  font-weight: 500;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1e88e5;
  color: white;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
}

.btn-secondary {
  background-color: #757575;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-container {
  height: 6px;
  background-color: #f0f9ff;
  border-radius: 3px;
  margin-bottom: 30px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #1e88e5;
  transition: width 0.5s;
}

.session-history {
  margin-top: 30px;
}

.session-history h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f1f3f5;
}

.history-content {
  display: flex;
  flex-direction: column;
}

.history-title {
  font-weight: 500;
}

.history-time {
  font-size: 12px;
  color: #757575;
}

.history-duration {
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #1976d2;
}

.empty-history {
  text-align: center;
  padding: 30px;
  color: #757575;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pomodoro-container.collapsed {
    right: 5px;
    width: 70px;
  }
  
  .collapsed-time {
    font-size: 12px;
  }
  
  .btn-mini {
    font-size: 14px;
    width: 28px;
    height: 28px;
  }
}
</style>