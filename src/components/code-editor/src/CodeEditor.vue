<template>
  <div class="h-full">
    <CodeMirrorEditor
      :value="getValue"
      @change="handleValueChange"
      :mode="mode"
      :readonly="readonly"
    />
  </div>
</template>
<script setup>
import { computed } from "vue";
import CodeMirrorEditor from "./codemirror/CodeMirror.vue";
import { isString } from "@/utils";
import { MODE } from "./typing";

const props = defineProps({
  value: { type: [Object, String] },
  mode: {
    type: String,
    default: MODE.JSON,
    validator(value) {
      // 这个值必须匹配下列字符串中的一个
      return Object.values(MODE).includes(value);
    },
  },
  readonly: { type: Boolean },
  autoFormat: { type: Boolean, default: true },
});

const emit = defineEmits(["change", "update:value", "format-error"]);

const getValue = computed(() => {
  const { value, mode, autoFormat } = props;
  if (!autoFormat || mode !== MODE.JSON) {
    return value;
  }
  let result = value;
  if (isString(value)) {
    try {
      result = JSON.parse(value);
    } catch (e) {
      emit("format-error", value);
      return value;
    }
  }
  return JSON.stringify(result, null, 2);
});

function handleValueChange(v) {
  emit("update:value", v);
  emit("change", v);
}
</script>
