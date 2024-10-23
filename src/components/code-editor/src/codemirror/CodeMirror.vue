<template>
  <div class="relative !h-full w-full overflow-hidden" ref="el"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect, watch, nextTick } from "vue";
import { useWindowSizeFn } from "@/hooks";
import { useDebounceFn } from "@vueuse/core";
import * as Mirror from "codemirror";
import { MODE } from "./../typing";
// css
import "./codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/dracula.css";

// modes
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/css/css";
import "codemirror/mode/htmlmixed/htmlmixed";
const props = defineProps({
  mode: {
    type: String,
    default: MODE.JSON,
    validator(value) {
      // 这个值必须匹配下列字符串中的一个
      return Object.values(MODE).includes(value);
    },
  },
  value: { type: String, default: "" },
  readonly: { type: Boolean, default: false },
  theme: { type: String, default: "material-palenight" },
});

const emit = defineEmits(["change"]);

const el = ref();
let editor;

const debounceRefresh = useDebounceFn(refresh, 100);

watch(
  () => props.value,
  async (value) => {
    await nextTick();
    const oldValue = editor?.getValue();
    if (value !== oldValue) {
      editor?.setValue(value ? value : "");
    }
  },
  { flush: "post" }
);

watchEffect(() => {
  editor?.setOption("mode", props.mode);
});

function refresh() {
  editor?.refresh();
}

async function init() {
  const addonOptions = {
    autoCloseBrackets: true,
    autoCloseTags: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers"],
  };

  editor = Mirror(el.value, {
    value: "",
    mode: props.mode,
    readOnly: props.readonly,
    tabSize: 2,
    theme: props.theme,
    lineWrapping: true,
    lineNumbers: true,
    ...addonOptions,
  });
  editor?.setValue(props.value);
  // setTheme()
  editor?.on("change", () => {
    emit("change", editor?.getValue());
  });
}

onMounted(async () => {
  await nextTick();
  init();
  useWindowSizeFn(debounceRefresh);
});

onUnmounted(() => {
  editor = null;
});
</script>
