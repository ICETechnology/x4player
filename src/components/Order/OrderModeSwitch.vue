<template>
	<span class="font-size-small icon-btn flex-center"><i class="material-icons tcef clr-orange" @click="onClick">loop</i></span>
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
    methods: {
		onClick() {
			this.$store.state.config.orderBoxMode = ++this.$store.state.config.orderBoxMode % 2;
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>

</style>