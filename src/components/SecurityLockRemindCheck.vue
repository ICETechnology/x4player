<template>
	<div class="security-lock-remind-check">
		<!-- 內文 -->
		<span v-html="$store.state.config.CONFIG.SecurityLock.remind.content||''"></span>
		<!-- 不再提醒勾選框 -->
		<p class="text-align-left"><input type="checkbox" v-model="$store.state.status.isNotRemindSecurityLock">
			{{$ln($store.state.config.CONFIG.SecurityLock.remind.noRemind)}}
		</p>
	</div>
</template>

<script>

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
	},
	beforeDestroy() {
	},
	components: {
	},
	methods: {
	},
	watch: {
	},
	computed: {
	}
}
</script>

<style scoped>
</style>