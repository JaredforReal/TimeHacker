<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-button" @click="close">×</button>
      <h2>欢迎来到 TimeHacker!</h2>
      <p>这是一款帮助您管理时间、提高效率的工具。</p>
      
      <h4>核心功能：</h4>
      <ul>
        <li><strong>番茄钟:</strong> 位于页面中心，帮助您保持专注。</li>
        <li><strong>待办事项:</strong> 在下方添加和管理您的任务。</li>
        <li><strong>标签过滤:</strong> 使用标签云快速筛选不同类型的任务。</li>
        <li><strong>日历视图:</strong> 点击顶部的日历图标，查看您的任务安排。</li>
      </ul>

      <button class="btn btn-primary" @click="close">我明白了</button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 500px;
  position: relative;
}

.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

h2 {
  margin-top: 0;
  color: #333;
  font-size: 22px;
  margin-bottom: 15px;
}

p, ul {
  color: #555;
  line-height: 1.6;
}

ul {
  padding-left: 20px;
  margin-bottom: 25px;
}

li {
  margin-bottom: 10px;
}
</style>
