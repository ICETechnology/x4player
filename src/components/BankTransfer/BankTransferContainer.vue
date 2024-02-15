<template>
    <div class="bank-transfer-container">
		<TabGroup class="FULL" :selectedIdx="0" :tabList="tabList" />
    </div>
</template>

<script>
import BankTransfer from "@/components/BankTransfer/BankTransfer.vue";
import BankTransferReport from "@/components/BankTransfer/BankTransferReport.vue";
export default {
	props: [],
	data() {
		return {
			tabList: [
				{label: '资金转帐', comClass: BankTransfer},
				{label: '转帐记录', comClass: BankTransferReport},
            ],
        }
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

<style scoped>
</style>