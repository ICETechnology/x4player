<template>
    <div class="flex-center font-bold">
		{{displayLabel}}
    </div>
</template>
<script>
export default {
	computed: {
		displayLabel() {
			let layout = this.$store.state.config.CONFIG.LAYOUT;
			let key = this.$store.state.bottomBar.activeKey;
			return layout[key] ? layout[key].label : "";
		}
	}
}
</script>