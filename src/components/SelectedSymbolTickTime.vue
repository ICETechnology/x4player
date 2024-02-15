<template>
	<div class="selected-symbol-tick-time flex-center font-size-micro">
		{{displayText}}
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {},
	computed: {
        displayText() {
            return `${this.$store.state.selectedSymbol.QO.t}`;
        },
    },
}
</script>

<style scoped>
.selected-symbol-tick-time {
    position: absolute;
    top: 0;
    left: 42%;
    right: 42%;
    border: 1px solid white;
    border-radius: 1vw;
    z-index: 99999;
    pointer-events: none;
}
</style>