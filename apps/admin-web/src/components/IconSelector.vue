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
import {
  GridOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
  KeyOutline,
  FolderOutline,
  HomeOutline,
  SettingsOutline,
  AppsOutline,
  DocumentTextOutline,
  FileTrayOutline,
  PeopleOutline,
  LockClosedOutline,
  BulbOutline,
  ChatboxEllipsesOutline,
  NewspaperOutline,
  BarChartOutline,
  PieChartOutline,
  TrendingUpOutline,
  CalendarOutline,
  MailOutline,
  NotificationsOutline,
  CloudOutline,
  ServerOutline,
  CodeSlashOutline,
  HammerOutline,
  MenuOutline,
  CloseOutline,
  LayersOutline,
  LinkOutline,
  MapOutline,
  FlagOutline,
  StarOutline,
  HeartOutline,
  BookOutline,
  PencilOutline,
  TrashOutline,
  AddOutline,
  SearchOutline,
  FilterOutline,
  DownloadOutline,
  CloudUploadOutline,
  RefreshOutline,
  ShareOutline,
  CopyOutline,
  PrintOutline,
  CameraOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  ColorPaletteOutline,
  ConstructOutline,
  GitBranchOutline,
  TerminalOutline,
  CubeOutline,
  BasketOutline,
  CardOutline,
  WalletOutline,
  HourglassOutline,
  TimeOutline,
  AlarmOutline,
  LocationOutline,
  CompassOutline,
  AirplaneOutline,
  CarOutline,
  BoatOutline,
  BicycleOutline,
  TrainOutline,
  BusinessOutline,
  SchoolOutline,
  LibraryOutline,
  StorefrontOutline,
  CafeOutline,
  RestaurantOutline,
  FitnessOutline,
  GameControllerOutline,
  TvOutline,
  PhonePortraitOutline,
  TabletPortraitOutline,
  LaptopOutline,
  DesktopOutline,
  WatchOutline,
  EarOutline,
  EyeOutline,
  HandLeftOutline,
  WalkOutline,
} from '@vicons/ionicons5';

const props = defineProps<{
  value?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

/** 图标条目定义 */
interface IconItem {
  name: string;
  label: string;
  component: Component;
}

/** 预定义的图标列表 */
const icons: IconItem[] = [
  // 常用图标放在前面
  { name: 'dashboard', label: '仪表盘', component: GridOutline },
  { name: 'menu', label: '菜单', component: MenuOutline },
  { name: 'user', label: '用户', component: PersonOutline },
  { name: 'role', label: '角色', component: ShieldCheckmarkOutline },
  { name: 'permission', label: '权限', component: KeyOutline },
  { name: 'file', label: '文件', component: FolderOutline },
  { name: 'home', label: '首页', component: HomeOutline },
  { name: 'settings', label: '设置', component: SettingsOutline },
  { name: 'apps', label: '应用', component: AppsOutline },
  { name: 'document', label: '文档', component: DocumentTextOutline },
  { name: 'file-tray', label: '文件盘', component: FileTrayOutline },
  { name: 'people', label: '人群', component: PeopleOutline },
  { name: 'lock', label: '锁定', component: LockClosedOutline },
  { name: 'bulb', label: '灯泡', component: BulbOutline },
  { name: 'chat', label: '聊天', component: ChatboxEllipsesOutline },
  { name: 'news', label: '新闻', component: NewspaperOutline },
  { name: 'bar-chart', label: '柱状图', component: BarChartOutline },
  { name: 'pie-chart', label: '饼图', component: PieChartOutline },
  { name: 'trending', label: '趋势', component: TrendingUpOutline },
  { name: 'calendar', label: '日历', component: CalendarOutline },
  { name: 'mail', label: '邮件', component: MailOutline },
  { name: 'notification', label: '通知', component: NotificationsOutline },
  { name: 'cloud', label: '云', component: CloudOutline },
  { name: 'server', label: '服务器', component: ServerOutline },
  { name: 'code', label: '代码', component: CodeSlashOutline },
  { name: 'tools', label: '工具', component: HammerOutline },
  { name: 'layers', label: '层级', component: LayersOutline },
  { name: 'link', label: '链接', component: LinkOutline },
  { name: 'map', label: '地图', component: MapOutline },
  { name: 'flag', label: '旗帜', component: FlagOutline },
  { name: 'star', label: '星标', component: StarOutline },
  { name: 'heart', label: '收藏', component: HeartOutline },
  { name: 'book', label: '书籍', component: BookOutline },
  { name: 'pencil', label: '编辑', component: PencilOutline },
  { name: 'trash', label: '删除', component: TrashOutline },
  { name: 'add', label: '新增', component: AddOutline },
  { name: 'search', label: '搜索', component: SearchOutline },
  { name: 'filter', label: '筛选', component: FilterOutline },
  { name: 'download', label: '下载', component: DownloadOutline },
  { name: 'upload', label: '上传', component: CloudUploadOutline },
  { name: 'refresh', label: '刷新', component: RefreshOutline },
  { name: 'share', label: '分享', component: ShareOutline },
  { name: 'copy', label: '复制', component: CopyOutline },
  { name: 'print', label: '打印', component: PrintOutline },
  { name: 'camera', label: '相机', component: CameraOutline },
  { name: 'image', label: '图片', component: ImageOutline },
  { name: 'video', label: '视频', component: VideocamOutline },
  { name: 'music', label: '音乐', component: MusicalNotesOutline },
  { name: 'palette', label: '调色板', component: ColorPaletteOutline },
  { name: 'construct', label: '构建', component: ConstructOutline },
  { name: 'git', label: 'Git', component: GitBranchOutline },
  { name: 'terminal', label: '终端', component: TerminalOutline },
  { name: 'cube', label: '立方体', component: CubeOutline },
  { name: 'basket', label: '购物篮', component: BasketOutline },
  { name: 'card', label: '卡片', component: CardOutline },
  { name: 'wallet', label: '钱包', component: WalletOutline },
  { name: 'time', label: '时间', component: TimeOutline },
  { name: 'location', label: '位置', component: LocationOutline },
  { name: 'compass', label: '指南针', component: CompassOutline },
  { name: 'business', label: '企业', component: BusinessOutline },
  { name: 'school', label: '学校', component: SchoolOutline },
  { name: 'library', label: '图书馆', component: LibraryOutline },
  { name: 'store', label: '商店', component: StorefrontOutline },
  { name: 'cafe', label: '咖啡', component: CafeOutline },
  { name: 'game', label: '游戏', component: GameControllerOutline },
  { name: 'tv', label: '电视', component: TvOutline },
  { name: 'phone', label: '手机', component: PhonePortraitOutline },
  { name: 'tablet', label: '平板', component: TabletPortraitOutline },
  { name: 'laptop', label: '笔记本', component: LaptopOutline },
  { name: 'desktop', label: '桌面', component: DesktopOutline },
  { name: 'eye', label: '眼睛', component: EyeOutline },
];

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
