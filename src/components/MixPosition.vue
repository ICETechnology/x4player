<template>
	<transition name="slide-left">
		<component :is="$store.state.mixPosition.positionType" :suspend="suspend" :visibility="visibility" />
	</transition>
</template>

<script>
export default {
	mixins: [],
	props: ["suspend", "visibility"],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style>
</style>