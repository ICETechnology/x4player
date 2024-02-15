<template>
	<div class="price-radio-qty-btn-ctn flex-row w100p flex-start">
		<div class="rbtn mgr1 tcef" @click="$emit('onQty', 1)">1</div>
		<div class="rbtn mgr1 tcef" @click="$emit('onPlusQty', 5)">5x</div>
		<div class="rbtn mgr1 tcef" @click="$emit('onPlusQty', 20)">20x</div>
		<div class="rbtn tcef" @click="$emit('onPlusQty', 50)">50x</div>
	</div>
</template>

<script>
export default {
	props: ["hideType", "sid"],
	data() {
		return {
		}
	},
}
</script>

<style scoped>
</style>