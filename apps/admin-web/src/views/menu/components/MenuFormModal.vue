<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import type { FormInst, TreeSelectOption } from 'naive-ui';
import { useMessage, NGrid, NGridItem } from 'naive-ui';
import { createMenu, updateMenu } from '@/api/menu';
import type { MenuInfo, MenuTreeNode } from '@/api/menu';
import IconSelector from '@/components/IconSelector.vue';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  menuData: Partial<MenuInfo> | null;
  parentMenu: Partial<MenuInfo> | null;
  menuTree: MenuTreeNode[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);

const formState = reactive({
  parentId: null as string | null,
  type: 'dir',
  name: '',
  routeName: '',
  path: '',
  redirect: '',
  icon: '',
  component: '',
  linkUrl: '',
  permission: '',
  sort: 0,
  isLink: 0,
  isHidden: 0,
  isAffix: 0,
  keepAlive: 0,
  isIframe: 0,
});

const formRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'blur' }],
};

// ─── 上级菜单树选项 ──────────────────────────────────────────

/** 将 MenuTreeNode 递归转为 TreeSelectOption */
function toTreeOptions(nodes: MenuTreeNode[]): TreeSelectOption[] {
  return nodes.map((n) => ({
    label: n.name,
    value: n._id,
    isLeaf: !n.children?.length,
    children: n.children?.length ? toTreeOptions(n.children) : undefined,
  }));
}

const menuTreeOptions = computed(() => {
  const options = toTreeOptions(props.menuTree);
  // 根节点选项
  options.unshift({ label: '根菜单（无上级）', value: null });
  return options;
});

// ─── 类型选项 ────────────────────────────────────────────────

const typeOptions = [
  { label: '目录', value: 'dir' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

// ─── 弹窗打开时初始化 ────────────────────────────────────────

watch(
  () => props.visible,
  (val) => {
    if (!val) return;
    resetForm();
    if (props.mode === 'edit' && props.menuData) {
      const row = props.menuData;
      formState.parentId = row.parentId ?? null;
      formState.type = row.type ?? 'dir';
      formState.name = row.name ?? '';
      formState.routeName = row.routeName ?? '';
      formState.path = row.path ?? '';
      formState.redirect = row.redirect ?? '';
      formState.icon = row.icon ?? '';
      formState.component = row.component ?? '';
      formState.linkUrl = row.linkUrl ?? '';
      formState.permission = row.permission ?? '';
      formState.sort = row.sort ?? 0;
      formState.isLink = row.isLink ? 1 : 0;
      formState.isHidden = row.isHidden ?? 0;
      formState.isAffix = row.isAffix ?? 0;
      formState.keepAlive = row.keepAlive ?? 0;
      formState.isIframe = row.isIframe ?? 0;
    } else if (props.mode === 'create' && props.parentMenu) {
      formState.parentId = props.parentMenu._id ?? null;
    }
  },
);

function resetForm() {
  formState.parentId = null;
  formState.type = 'dir';
  formState.name = '';
  formState.routeName = '';
  formState.path = '';
  formState.redirect = '';
  formState.icon = '';
  formState.component = '';
  formState.linkUrl = '';
  formState.permission = '';
  formState.sort = 0;
  formState.isLink = 0;
  formState.isHidden = 0;
  formState.isAffix = 0;
  formState.keepAlive = 0;
  formState.isIframe = 0;
}

// ─── 提交 ────────────────────────────────────────────────────

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    const payload = {
      name: formState.name,
      routeName: formState.routeName || undefined,
      path: formState.path || undefined,
      component: formState.component || undefined,
      redirect: formState.redirect || undefined,
      icon: formState.icon || undefined,
      linkUrl: formState.linkUrl || undefined,
      permission: formState.permission || undefined,
      sort: formState.sort,
      type: formState.type,
      isLink: formState.isLink,
      isHidden: formState.isHidden,
      isAffix: formState.isAffix,
      keepAlive: formState.keepAlive,
      isIframe: formState.isIframe,
    };

    if (props.mode === 'edit' && props.menuData?._id) {
      await updateMenu(props.menuData._id, { ...payload, status: 1 });
      message.success('更新成功');
    } else {
      await createMenu({ ...payload, parentId: formState.parentId });
      message.success('创建成功');
    }
    emit('saved');
  } catch (err) {
    const errorMsg = (err as { message?: string })?.message ?? '操作失败';
    message.error(errorMsg);
  }
}
</script>

<template>
  <n-modal
    :show="visible"
    :title="mode === 'edit' ? '编辑菜单' : '新增菜单'"
    preset="card"
    style="width: 40%"
    :mask-closable="false"
    @update:show="emit('close')"
  >
    <n-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      label-placement="top"
      label-width="auto"
    >
      <n-form-item label="上级菜单">
        <n-tree-select
          :options="menuTreeOptions"
          placeholder="请选择上级菜单"
          v-model:value="formState.parentId"
          clearable
          filterable
          :default-value="null"
        />
      </n-form-item>
      <n-grid :cols="24" :x-gap="16">
        <n-grid-item :span="24">
          <n-form-item label="菜单类型" path="type">
            <n-radio-group v-model:value="formState.type">
              <n-radio
                v-for="opt in typeOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </n-radio-group>
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12">
          <n-form-item label="菜单名称" path="name">
            <n-input v-model:value="formState.name" placeholder="格式: message.router.xxx" />
          </n-form-item>
        </n-grid-item>

        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="路由名称" path="routeName">
            <n-input v-model:value="formState.routeName" placeholder="路由中的 name 值" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="路由路径" path="path">
            <n-input v-model:value="formState.path" placeholder="路由中的 path 值" />
          </n-form-item>
        </n-grid-item>

        <n-grid-item :span="12" v-if="formState.type === 'dir'">
          <n-form-item label="重定向" path="redirect">
            <n-input v-model:value="formState.redirect" placeholder="请输入路由重定向" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="菜单图标" path="icon">
            <IconSelector v-model:value="formState.icon" />
          </n-form-item>
        </n-grid-item>

        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="组件路径" path="component">
            <n-input v-model:value="formState.component" placeholder="组件路径" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="链接地址" path="linkUrl">
            <n-input
              v-model:value="formState.linkUrl"
              placeholder="外链/内嵌时链接地址 (http://xxx.com)"
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type === 'button'">
          <n-form-item label="权限标识" path="permission">
            <n-input v-model:value="formState.permission" placeholder="如 system:user:read" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12">
          <n-form-item label="菜单排序" path="sort">
            <n-input-number
              v-model:value="formState.sort"
              :min="0"
              :max="9999"
              style="width: 100%"
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="是否隐藏" path="isHidden">
            <n-radio-group v-model:value="formState.isHidden">
              <n-radio :value="1" label="隐藏" />
              <n-radio :value="0" label="不隐藏" />
            </n-radio-group>
          </n-form-item>
        </n-grid-item>

        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="页面缓存" path="keepAlive">
            <n-radio-group v-model:value="formState.keepAlive">
              <n-radio :value="1" label="缓存" />
              <n-radio :value="0" label="不缓存" />
            </n-radio-group>
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="是否固定" path="isAffix">
            <n-radio-group v-model:value="formState.isAffix">
              <n-radio :value="1" label="固定" />
              <n-radio :value="0" label="不固定" />
            </n-radio-group>
          </n-form-item>
        </n-grid-item>

        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="是否外链" path="isLink">
            <n-radio-group v-model:value="formState.isLink">
              <n-radio :value="1" label="是" />
              <n-radio :value="0" label="否" />
            </n-radio-group>
          </n-form-item>
        </n-grid-item>
        <n-grid-item :span="12" v-if="formState.type !== 'button'">
          <n-form-item label="是否内嵌" path="isIframe">
            <n-radio-group v-model:value="formState.isIframe">
              <n-radio :value="1" label="是" />
              <n-radio :value="0" label="否" />
            </n-radio-group>
          </n-form-item>
        </n-grid-item>
      </n-grid>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('close')">取消</n-button>
        <n-button type="primary" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
