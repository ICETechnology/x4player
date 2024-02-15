<template>
    <div class="button-ctn flex-center tcef btn-default-ht-rd" :class="[(color||'') + (disabled||'')]" @click="onClick">
		<slot></slot>
    </div>
</template>

<script>
export default {
	props: ['color', 'disabled'],
	data() {
		return {
        }
	},
    methods: {
		onClick() {
			this.$emit("click");
		},
	},
}
</script>

<style scoped>
/* 預設樣式：白底黑字 + btn-default-ht-rd */
.button-ctn {
	color: black;
	background-color: white;
}
.button-ctn.disabled {
	color: #585959 !important;
	background-color: #373B41 !important;
	pointer-events: none;
}
.button-ctn.white {
	background-color: white;
	color: black;
}
.button-ctn.touching {
	background-color: #444;
}
.button-ctn.selected {
	color: white;
	background-color: #518FF5;
}
.button-ctn.orange {
	color: white;
	background-color: orange;
}
.button-ctn.outline {
	color: white;
	border: 1px solid white;
	background-color: inherit;
}
.button-ctn.outline.selected {
	color: #D29722;
	border: 2px solid #D29722;
}
/* 取消按鈕 */
.btn-cancel {
	width: 32vw;
    height: 9vw;
    border-radius: 1vw;
	color: black;
	background-color: #D8D8D8;
}
/* 確認按鈕 */
.btn-confirm {
	width: 32vw;
    height: 9vw;
    border-radius: 1vw;
	color: white;
	background-color: #F5A623;
}
.btn-confirm-iceben {
	color: white;
	background-color: #F5A623;
	height: 9vw;
	border-radius: 1vw;
}
.btn-confirm-iceben-gray {
	color: white;
	background-color: #363C42;
	height: 9vw;
	border-radius: 1vw;
}
.btn-confirm.dark {
	background-color: #111820;
	border: 1px solid #444;
	box-sizing: border-box;
}
/* 停用 */
.btn-confirm.disabled {
	pointer-events: none;
	color: #DDD;
	background-color: #999;
}
/* ben 新按鈕樣式 */
.button-ctn.iceben {
	color: white;
	background-color: #0D79F2;
}
.button-ctn.iceben.orange {
	color: white;
	background-color: #F5A623;
}

/** 桌機版 */
.desktop .button-ctn:hover {
	color: aqua;
	cursor: pointer;
}
.desktop .btn-cancel, .desktop .btn-confirm {
	width: auto;
	height: auto;
	padding: 8px 0;
	min-width: 8em;
	border-radius: 0.45em;
}
</style>