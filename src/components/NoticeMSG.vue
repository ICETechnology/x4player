<template>
	<div class="flex-col NoticeMsg-ctn" v-stop-propagation-y>
		<TabGroup ref="tg" tabKey="TG-NoticeMSG" :tabList="tabList" :selectedIdx="0"></TabGroup>
	</div>
</template>
<script>
import NoticeMSGHoldPromp from '@/components/NoticeMSGHoldPromp'
import NoticeMSGExerciseAsign from '@/components/NoticeMSGExerciseAsign'
import NoticeMSGCoverShort from '@/components/NoticeMSGCoverShort'
export default {
	data(){
		return {
			tabList: [{
					"label": "持仓合约",
					"comClass": NoticeMSGHoldPromp,
				},
				{
					"label": "行權指派",
					"comClass": NoticeMSGExerciseAsign
				},
				{
					"label": "备兑证券不足",
					"comClass": NoticeMSGCoverShort,
				}]
		}
	},
	methods: {},
	beforeMount() {
		this.$emit('title', `${this.$ln(`消息提醒`)} - ${this.$store.state.login.accountID}`);
	},
}
</script>
<style scoped>
/** 桌機版 */
.desktop .NoticeMsg-ctn /deep/ .head .tab-ctn{
	overflow-y: auto;
}
.desktop .NoticeMsg-ctn /deep/ .head .tab{
	padding: 0px;
}
</style>