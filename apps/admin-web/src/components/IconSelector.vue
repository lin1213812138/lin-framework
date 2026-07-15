<script setup lang="ts">
/**
 * 菜单图标选择器
 *
 * 弹出栅格面板，从预定义的 ionicons 图标库中选择。
 * 支持 v-model，可作为 Naive UI 表单的自定义组件使用。
 *
 * @example
 * ```vue
 * <IconSelector v-model:value="formState.icon" />
 * ```
 */
import { ref, computed, h } from 'vue';
import { NIcon } from 'naive-ui';
import type { Component } from 'vue';
import { CloseOutline, SearchOutline } from '@vicons/ionicons5';
import { ICON_LIST } from '@/constants/icons';

const props = defineProps<{
  value?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

/** 图标条目定义 */
// 使用 @/constants/icons 中导出的 IconItem

/** 预定义的图标列表（来自共享注册表） */
const icons = ICON_LIST;

const searchKeyword = ref('');
const popoverVisible = ref(false);

/** 搜索过滤后的图标 */
const filteredIcons = computed(() => {
  if (!searchKeyword.value) return icons;
  const kw = searchKeyword.value.toLowerCase();
  return icons.filter((icon) => icon.name.includes(kw) || icon.label.includes(kw));
});

/** 选中图标 */
function selectIcon(name: string) {
  emit('update:value', name);
  popoverVisible.value = false;
  searchKeyword.value = '';
}

/** 清空图标 */
function clearIcon() {
  emit('update:value', '');
  popoverVisible.value = false;
}

/** 渲染图标组件 */
function renderIcon(component: Component) {
  return h(NIcon, { size: 22 }, { default: () => h(component) });
}

/** 当前选中的图标信息 */
const selectedIcon = computed(() => icons.find((icon) => icon.name === props.value));

/** 判断是否选中 */
function isSelected(name: string) {
  return props.value === name;
}

/** 获取图标项的 class */
function getIconClass(name: string) {
  return {
    'icon-selector-item': true,
    'icon-selector-item--selected': isSelected(name),
  };
}

/** 鼠标悬停处理 */
function onIconEnter(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  if (el.classList.contains('icon-selector-item--selected')) {
    el.style.backgroundColor = 'var(--primary-color-hover, #36ad6a)';
  } else {
    el.style.backgroundColor = 'var(--hover-color, #f0f0f0)';
  }
}

/** 鼠标离开处理 */
function onIconLeave(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  if (!el.classList.contains('icon-selector-item--selected')) {
    el.style.backgroundColor = '';
  }
}

/** 弹窗关闭时复位 */
function onPopoverClose() {
  popoverVisible.value = false;
  searchKeyword.value = '';
}
</script>

<template>
  <n-popover
    placement="bottom-start"
    :show="popoverVisible"
    @clickoutside="onPopoverClose"
    width="trigger"
  >
    <template #trigger>
      <n-input-group>
        <n-input
          :value="value"
          placeholder="请输入或选择图标"
          readonly
          @click="popoverVisible = !popoverVisible"
        >
          <template #prefix>
            <n-icon v-if="selectedIcon" :component="selectedIcon.component" size="18" />
          </template>
        </n-input>
        <n-button v-if="value" type="error" quaternary @click.stop="clearIcon">
          <template #icon>
            <n-icon :component="CloseOutline" />
          </template>
        </n-button>
      </n-input-group>
    </template>

    <div style="width: 100%; max-width: 320px">
      <n-input
        v-model:value="searchKeyword"
        placeholder="搜索图标..."
        clearable
        style="margin-bottom: 8px"
      >
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>

      <div
        style="
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          max-height: 260px;
          overflow-y: auto;
        "
      >
        <div
          v-for="icon in filteredIcons"
          :key="icon.name"
          :title="`${icon.label} (${icon.name})`"
          :class="getIconClass(icon.name)"
          :style="{
            color: value === icon.name ? '#fff' : 'inherit',
            backgroundColor: isSelected(icon.name) ? 'var(--primary-color, #18a058)' : undefined,
          }"
          @click="selectIcon(icon.name)"
          @mouseenter="onIconEnter"
          @mouseleave="onIconLeave"
        >
          <n-icon :component="icon.component" size="22" />
          <span
            style="
              font-size: 10px;
              margin-top: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 48px;
            "
            >{{ icon.label }}</span
          >
        </div>
      </div>

      <div
        v-if="filteredIcons.length === 0"
        style="text-align: center; padding: 24px 0; color: #999"
      >
        未找到匹配图标
      </div>
    </div>
  </n-popover>
</template>

<style scoped>
.icon-selector-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 2px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.icon-selector-item:hover {
  background: var(--hover-color, #f0f0f0);
}

.icon-selector-item--selected {
  background: var(--primary-color, #18a058) !important;
  color: #fff;
}

.icon-selector-item--selected:hover {
  background: var(--primary-color-hover, #36ad6a) !important;
}
</style>
