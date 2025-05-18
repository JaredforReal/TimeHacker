<template>
    <div class="calendar-overlay" @click.self="$emit('close')">
        <div class="calendar-modal">
            <!-- 左侧面板 -->
            <div class="left-panel">
                <!-- 创建任务按钮/表单 -->
                <div class="create-task-section" :class="{ 'expanded': showTaskForm }">
                    <button v-if="!showTaskForm" @click="showTaskForm = true" class="create-task-btn">
                        <span class="plus-icon">+</span> 创建任务
                    </button>
                    <div v-else class="task-form">
                        <div class="form-header">
                            <h3 class="panel-title">创建任务</h3>
                            <button @click="showTaskForm = false" class="close-form-btn">×</button>
                        </div>
                        <form @submit.prevent="addTask">
                            <input v-model="taskTitle" placeholder="任务标题" required class="form-input" />

                            <!-- 时间选择器组 -->
                            <div class="time-picker-group">
                                <div class="time-picker">
                                    <input type="datetime-local" v-model="taskStart" required class="form-input" />
                                    <button type="button" @click="confirmTime('start')" class="confirm-time-btn">
                                        确定
                                    </button>
                                </div>
                                <div class="time-picker">
                                    <input type="datetime-local" v-model="taskEnd" required class="form-input" />
                                    <button type="button" @click="confirmTime('end')" class="confirm-time-btn">
                                        确定
                                    </button>
                                </div>
                            </div>

                            <!-- 颜色选择器 -->
                            <div class="color-picker">
                                <span class="color-label">任务颜色:</span>
                                <div class="color-options">
                                    <div v-for="color in taskColors" :key="color"
                                        :class="['color-option', { selected: selectedColor === color }]"
                                        :style="{ backgroundColor: color }" @click="selectedColor = color">
                                    </div>
                                </div>
                            </div>

                            <button type="submit" class="submit-btn">添加任务</button>
                        </form>
                    </div>
                </div>

                <!-- 小日历 -->
                <div class="mini-calendar" :class="{ 'pushed-down': showTaskForm }">
                    <div class="calendar-header">
                        <button @click="previousMonth" class="nav-btn">&lt;</button>
                        <span class="month-year">{{ currentMonthYear }}</span>
                        <button @click="nextMonth" class="nav-btn">&gt;</button>
                    </div>
                    <div class="weekdays">
                        <span v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="weekday">
                            {{ day }}
                        </span>
                    </div>
                    <div class="days">
                        <div v-for="day in calendarDays" :key="day.date" class="day" :class="{
                            'current': isCurrentDay(day),
                            'selected': isSelectedDay(day),
                            'other-month': !day.isCurrentMonth
                        }" @click="selectDay(day)">
                            {{ day.dayNumber }}
                            <div class="day-events" v-if="getDayEvents(day).length">
                                <div v-for="event in getDayEvents(day)" :key="event.id" class="day-event-dot"
                                    :style="{ backgroundColor: event.color }">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 当天任务列表 -->
                <div class="day-events-list">
                    <h4 class="list-title">{{ selectedDateStr }}的任务</h4>
                    <div class="events-container">
                        <div v-for="event in selectedDateEvents" :key="event.id" class="event-item"
                            :style="{ borderLeftColor: event.color }">
                            <span class="event-time">
                                {{ formatEventTime(event) }}
                            </span>
                            <span class="event-title">{{ event.title }}</span>
                            <button @click="deleteEvent(event)" class="delete-event-btn">
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧日历面板 -->
            <div class="calendar-panel">
                <FullCalendar ref="calendarRef" :options="calendarOptions" />
            </div>
            <!-- 事件编辑弹窗 -->
            <div v-if="editingEvent" class="event-popup-overlay" @click.self="closeEventPopup">
                <div class="event-popup" :style="popupPosition">
                    <!-- 标题行 -->
                <div class="popup-header">
                    <div class="color-indicator" :style="{ backgroundColor: editingEvent.color }"></div>
                    <input v-model="editingEvent.title" class="title-input" :placeholder="editingEvent.title || '无标题'"
                        @keyup.enter="saveEventChanges" />
                </div>

                <!-- 时间行 -->
                <div class="event-time-row">
                    {{ formatEventFullDate(editingEvent) }}
                </div>

                <!-- 工具栏 -->
                <div class="popup-toolbar">
                    <div class="popup-toolbar">
                        <button class="toolbar-btn edit-btn" @click="toggleEditMode">
                            <span class="material-icon">✏️</span>
                        </button>
                        <button class="toolbar-btn delete-btn" @click="handleDelete">
                            <span class="material-icon">🗑️</span>
                        </button>
                        <button class="toolbar-btn close-btn" @click="closeEventPopup">
                            <span class="material-icon">✕</span>
                        </button>
                    </div>
                </div>
                <!-- 添加编辑模式内容 -->
                <div v-if="isEditing" class="edit-panel">
                    <input v-model="editingEvent.title" class="edit-title-input" placeholder="任务标题" />
                    <div class="edit-time">
                        <input type="datetime-local" v-model="editingEvent.start" class="time-input" />
                        <span>至</span>
                        <input type="datetime-local" v-model="editingEvent.end" class="time-input" />
                    </div>
                    <div class="edit-colors">
                        <div v-for="color in taskColors" :key="color" class="color-option"
                            :class="{ selected: editingEvent.color === color }" :style="{ backgroundColor: color }"
                            @click="updateEventColor(color)">
                        </div>
                    </div>
                    <div class="edit-actions">
                        <button class="save-btn" @click="saveEventChanges">保存</button>
                        <button class="cancel-btn" @click="isEditing = false">取消</button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isToday, isSameDay, parseISO,
    startOfDay, endOfDay
} from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

// 导入 FullCalendar 样式
import '@fullcalendar/common/main.css'

// 任务颜色选项
const taskColors = [
    '#4dabf7', // 蓝色
    '#51cf66', // 绿色
    '#ff6b6b', // 红色
    '#ffd43b', // 黄色
    '#845ef7', // 紫色
    '#ff922b'  // 橙色
]

const calendarRef = ref(null)
const events = ref([])
const taskTitle = ref('')
const taskStart = ref('')
const taskEnd = ref('')
const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const showTaskForm = ref(false)
const selectedColor = ref(taskColors[0])
const editingEvent = ref(null)
const popupPosition = ref({})
const showColorPicker = ref(false)
const isEditing = ref(false)

// FullCalendar 配置
const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    events: events.value,
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    slotMinTime: '01:00:00',
    slotMaxTime: '23:00:00',
    height: '100%',
    locale: 'zh-cn',
    selectable: true,
    editable: true,           // 允许编辑
    eventResizableFromStart: true,  // 允许从开始处调整大小
    eventDurationEditable: true,    // 允许调整时长
    eventStartEditable: true,       // 允许调整开始时间
    // snapDuration: '00:15:00',      // 调整时的最小时间单位(15分钟)
    slotDuration: '00:30:00',      // 时间槽的间隔(30分钟)
    select: handleSelect,
    eventDrop: handleEventDrop,
    eventClick: openEventPopup
})

// 计算当前月份和年份
const currentMonthYear = computed(() => {
    return format(currentDate.value, 'yyyy年MM月')
})

// 计算日历天数
const calendarDays = computed(() => {
    const start = startOfMonth(currentDate.value)
    const end = endOfMonth(currentDate.value)

    return eachDayOfInterval({ start, end }).map(date => ({
        date,
        dayNumber: format(date, 'd'),
        isCurrentMonth: true
    }))
})

// 日历导航
function previousMonth() {
    currentDate.value = subMonths(currentDate.value, 1)
}

function nextMonth() {
    currentDate.value = addMonths(currentDate.value, 1)
}

// 日期选择
function isCurrentDay(day) {
    return isToday(day.date)
}

function isSelectedDay(day) {
    return isSameDay(day.date, selectedDate.value)
}

function selectDay(day) {
    selectedDate.value = day.date
    // 更新右侧日历视图
    calendarRef.value.getApi().gotoDate(day.date)
}

// 计算选中日期的显示文本
const selectedDateStr = computed(() => {
    return format(selectedDate.value, 'yyyy年MM月dd日')
})

// 计算选中日期的事件
const selectedDateEvents = computed(() => {
    return events.value.filter(event =>
        isSameDay(parseISO(event.start), selectedDate.value)
    ).sort((a, b) => parseISO(a.start) - parseISO(b.start))
})

// 获取某天的事件（用于显示小圆点）
function getDayEvents(day) {
    return events.value.filter(event => {
        const eventStart = parseISO(event.start)
        const eventEnd = parseISO(event.end)
        const currentDay = day.date

        // 检查当前日期是否在事件的开始和结束时间之间
        return currentDay >= startOfDay(eventStart) &&
            currentDay <= endOfDay(eventEnd)
    })
}

// 格式化事件时间显示
function formatEventTime(event) {
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    return `${format(start, 'HH:mm')}-${format(end, 'HH:mm')}`
}

// 确认时间选择
function confirmTime(type) {
    if (type === 'start' && taskEnd.value && taskStart.value > taskEnd.value) {
        alert('开始时间不能晚于结束时间')
        return
    }
    if (type === 'end' && taskStart.value && taskEnd.value < taskStart.value) {
        alert('结束时间不能早于开始时间')
        return
    }
}

// 添加任务
function addTask() {
    if (!taskTitle.value || !taskStart.value || !taskEnd.value) return

    const newEvent = {
        id: uuidv4(),
        title: taskTitle.value,
        start: taskStart.value,
        end: taskEnd.value,
        color: selectedColor.value,
        allDay: false
    }

    events.value.push(newEvent)
    calendarRef.value.getApi().addEvent(newEvent)

    // 重置表单
    taskTitle.value = ''
    taskStart.value = ''
    taskEnd.value = ''
    showTaskForm.value = false
}

// 删除事件
function deleteEvent(event) {
    const index = events.value.findIndex(e => e.id === event.id)
    if (index > -1) {
        events.value.splice(index, 1)
        calendarRef.value.getApi().getEventById(event.id)?.remove()
    }
}

// 处理拖拽创建
function handleSelect(selectInfo) {
    const title = prompt('请输入任务标题:')
    if (title) {
        const newEvent = {
            id: uuidv4(),
            title,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            color: taskColors[Math.floor(Math.random() * taskColors.length)],
            allDay: selectInfo.allDay
        }
        events.value.push(newEvent)
        calendarRef.value.getApi().addEvent(newEvent)
    }
}

function handleEventDrop(dropInfo) {
    const event = events.value.find(e => e.id === dropInfo.event.id)
    if (event) {
        event.start = dropInfo.event.startStr
        event.end = dropInfo.event.endStr
    }
}

// 添加新的格式化日期函数
function formatEventFullDate(event) {
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    const dateStr = format(start, 'M月d日 (EEEEEE)')
    const timeStr = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    return `${dateStr} · ${timeStr}`
}

// 打开事件编辑弹窗
function openEventPopup(eventClickInfo) {
    const event = eventClickInfo.event
    editingEvent.value = {
        id: event.id,
        title: event.title,
        start: event.startStr,
        end: event.endStr,
        color: event.backgroundColor
    }

    // 计算弹窗位置
    const rect = eventClickInfo.el.getBoundingClientRect()
    popupPosition.value = {
        top: `${rect.bottom + 10}px`, 
        left: `${rect.left}px`
    }
    isEditing.value = false
}

// 关闭事件编辑弹窗
function closeEventPopup() {
    editingEvent.value = null
    showColorPicker.value = false
    isEditing.value = false
}

// 切换颜色选择器
function toggleColorPicker() {
    showColorPicker.value = !showColorPicker.value
}

// 更新事件颜色
function updateEventColor(color) {
    if (editingEvent.value) {
        editingEvent.value.color = color
        showColorPicker.value = false
    }
}

// 保存事件更改
function saveEventChanges() {
    if (!editingEvent.value) return

    const event = events.value.find(e => e.id === editingEvent.value.id)
    if (event) {
        Object.assign(event, editingEvent.value)

        // 更新日历显示
        const calendarApi = calendarRef.value.getApi()
        const fcEvent = calendarApi.getEventById(event.id)
        if (fcEvent) {
            fcEvent.setProp('title', event.title)
            fcEvent.setProp('backgroundColor', event.color)
            fcEvent.setStart(event.start)
            fcEvent.setEnd(event.end)
        }
    }
    closeEventPopup()
}

// 切换编辑模式
function toggleEditMode() {
    isEditing.value = !isEditing.value
}

// 处理删除并关闭弹窗
function handleDelete() {
    deleteEvent(editingEvent.value)
    closeEventPopup()
}
</script>

<style scoped>
.event-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1100;
}

.event-popup {
    position: absolute;
    /* 改为 absolute */
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
    min-width: 320px;
    padding: 16px;
    animation: popup 0.2s ease;
}

.calendar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.calendar-modal {
    display: flex;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    width: 90%;
    max-width: 1400px;
    height: 80vh;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.left-panel {
    width: 320px;
    padding: 20px;
    background: #f8f9fa;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
}

/* 创建任务按钮/表单样式 */
.create-task-section {
    transition: all 0.3s ease;
}

.create-task-btn {
    width: 100%;
    padding: 10px;
    background: #4dabf7;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    transition: background 0.2s;
}

.create-task-btn:hover {
    background: #339af0;
}

.plus-icon {
    font-size: 18px;
}

.task-form {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.close-form-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #868e96;
}

.form-input {
    width: 100%;
    padding: 8px;
    margin-bottom: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.time-picker-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.time-picker {
    display: flex;
    gap: 8px;
}

.confirm-time-btn {
    padding: 4px 8px;
    background: #e9ecef;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.color-picker {
    margin: 16px 0;
}

.color-label {
    display: block;
    margin-bottom: 8px;
    color: #495057;
}

.color-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.color-option {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s;
}

.color-option.selected {
    transform: scale(1.2);
    box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
}

.submit-btn {
    width: 100%;
    padding: 10px;
    background: #4dabf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.submit-btn:hover {
    background: #339af0;
}

/* 小日历样式 */
.mini-calendar {
    background: white;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.mini-calendar.pushed-down {
    transform: translateY(20px);
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.nav-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #495057;
}

.month-year {
    font-weight: 500;
}

.weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 8px;
    font-size: 12px;
    color: #868e96;
}

.days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    position: relative;
    transition: all 0.2s;
}

.day.current {
    background: #4dabf7;
    color: white;
    font-weight: 500;
}

.day.selected {
    background: rgba(77, 171, 247, 0.1);
    border: 2px solid #4dabf7;
    font-weight: 500;
}

.day.other-month {
    color: #aaa;
}

.day-events {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    max-width: 100%;/* 限制宽度 */
    overflow: hidden;/* 超出隐藏 */
}

.day-event-dot {
    width: 4px;
        height: 4px;
        border-radius: 50%;
        flex-shrink: 0;
        /* 防止点被压缩 */
}

/* 当天任务列表样式 */
.day-events-list {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex: 1;
    display: flex;
    flex-direction: column;
}

.list-title {
    margin: 0 0 12px;
    color: #495057;
    font-weight: 500;
}

.events-container {
    flex: 1;
    overflow-y: auto;
}

.event-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-left: 3px solid;
    margin-bottom: 8px;
    background: #f8f9fa;
    border-radius: 4px;
}

.event-time {
    color: #868e96;
    font-size: 0.9em;
    min-width: 80px;
}

.event-title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-popup {
    position: fixed;
    z-index: 1100;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
    min-width: 320px;
    padding: 16px;
    animation: popup 0.2s ease;
}

.popup-default-view {
    padding: 16px;
}

.event-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 0;
    padding: 4px 0;
}

.edit-panel {
    border-top: 1px solid #eee;
    margin-top: 0;
    padding: 16px;
    background: #f8f9fa;
}

.popup-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.color-indicator {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    flex-shrink: 0;
}

.title-input {
    border: none;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    width: 100%;
    padding: 4px 0;
}

.title-input:focus {
    outline: none;
}

.event-time-row {
    color: #666;
    margin-bottom: 16px;
    padding-left: 32px;
    font-size: 14px;
}

.popup-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.toolbar-btn {
    background: none;
    border: none;
    padding: 6px;
    border-radius: 4px;
    cursor: pointer;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toolbar-btn:hover {
    background: #f5f5f5;
    color: #333;
}

.material-icon {
    font-size: 18px;
}

.calendar-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    color: #666;
    font-size: 14px;
}

.bell-icon,
.calendar-icon {
    font-size: 16px;
}

@keyframes popup {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.delete-event-btn {
    background: none;
    border: none;
    color: #adb5bd;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
}

.delete-event-btn:hover {
    color: #ff6b6b;
}

/* 右侧日历面板样式 */
.calendar-panel {
    flex: 1;
    padding: 20px;
}

.edit-panel {
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
}

.edit-title-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    margin-bottom: 12px;
}

.edit-time {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.edit-colors {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.edit-actions {
    display: flex;
    gap: 8px;
}

.save-btn,
.cancel-btn {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.save-btn {
    background: #4dabf7;
    color: white;
}

.cancel-btn {
    background: #e9ecef;
    color: #495057;
}

:deep(.fc) {
    height: 100% !important;
}

:deep(.fc-event) {
    border: none;
    padding: 2px 6px;
}

:deep(.fc-toolbar-title) {
    font-size: 1.2em !important;
}

:deep(.fc-button-primary) {
    background: #4dabf7 !important;
    border-color: #4dabf7 !important;
}
</style>