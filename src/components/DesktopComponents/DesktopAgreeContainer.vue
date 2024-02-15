<template>
    <div class="desktop-agree-container FULL flex-center">
		<div class="FULL mask"/>
		<div class="agree-ctn flex-col">
			<div class="bgc-head pd3">{{title}}</div>
			<div class="flex-1 posr">
				<Agree class="FULL" :param="{'mustAgree': true}" @title="onTitle" @close="$emit('close')"/>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			title: '',
		}
	},
    methods: {
		onTitle(str) {
			this.title = str;
		},
	},
}
</script>

<style scoped>
.mask {
	background-color: black;
	opacity: 0.7;
}
.agree-ctn {
	width: 23em;
	height: 35em;
	z-index: 99;
}
</style>