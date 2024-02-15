<template>
	<div class="flex-row label-text-ctn">
		<span class="flex-center title-ctn">{{$ln(label)}}</span>
		<span class="flex-center value-ctn"><slot></slot></span>
	</div>
</template>

<script>
export default {
	props: ['label'],
	data() {
		return {
        }
	},
}
</script>

<style scoped>
.label-text-ctn {
	border:1px solid rgba(100, 100, 100, 0.7);
	border-radius: 5px;
	height: 30px;
}
.label-text-ctn .title-ctn {
	padding: 5px;
	background-color: rgba(100, 100, 100, 0.7);
}
.label-text-ctn .value-ctn {
	padding: 5px;
}
</style>