<template>
    <div class="flex-col">
		<div class="flex-1 posr">
			<ADTop class="FULL" />
		</div>
		<ADBtn class="adbtn" />
    </div>
</template>

<script>
import ADTop from "@/components/ADTop.vue";
import ADBtn from "@/components/ADBtn.vue";
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		ADTop, ADBtn
	},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>