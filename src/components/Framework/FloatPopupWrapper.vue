<template>
	<transition name="show">
		<div class="flex-item wrapper">
			<slot></slot>
		</div>
	</transition>
</template>
<script>
export default {
	data() {
		return {
			onTransition: false
		};
	}
};
</script>
<style scoped>
.show-leave-to,
.show-enter {
	transform: translateY(100%);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave-active,
.show-enter-active {
	transition-duration: 0.3s;
	transition-property: transform;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave,
.show-enter-to {
	transform: translateY(0%);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.wrapper {
	width: 100%;
	height: 100%;
	background-color: #333;
}
</style>

