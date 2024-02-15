<template>
	<ScrollBounce class="FULL font-size-small" v-stop-propagation-y>
		<LogConsoleTemplate skey="dispatcher/pnr"/>
		<LogConsoleTemplate skey="Symbol/get"/>
		<LogConsoleTemplate skey="Q"/>
		<LogConsoleTemplate skey="OG"/>
		<LogConsoleTemplate skey="K"/>
		<LogConsoleTemplate skey="ad"/>
		<LogConsoleTemplate skey="rsrc"/>
		<LogConsoleTemplate skey="analysis"/>
		<LogConsoleTemplate skey="HistoryData"/>
		<LogConsoleTemplate skey="TRADE/report"/>
		<LogConsoleTemplate skey="TRADE/report.account"/>
		<LogConsoleTemplate skey="TRADE/account.positionsum"/>
		<LogConsoleTemplate skey="TRADE/account.position"/>
		<LogConsoleTemplate skey="TRADE/account.rights"/>
		<LogConsoleTemplate skey="OptionCloud"/>
    </ScrollBounce>
</template>

<script>
import LogConsoleTemplate from "@/components/LogConsoleTemplate.vue";

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {this.$emit('title', 'SettingConsole')},
	beforeDestroy() {},
	components: {
		LogConsoleTemplate,
	},
    methods: {
	},
	watch: {},
    computed: {
	},
}
</script>

<style scoped>
</style>