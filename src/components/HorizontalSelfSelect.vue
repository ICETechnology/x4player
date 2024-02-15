<template>
    <div class="flex-row scrolling-x posr" v-stop-propagation-x>
		<div v-for="(sid, idx) in sidList" :key="`hss-${idx}`">
            <QuoteCardSD class="quote-card-sd mgr5 " :sid="sid" :configColumn="true" :autoHeight="true"
				@onQuoteCardClick="$emit('onQuoteCardClick')"
				:notPopupDialog="notPopupDialog" />
        </div>
        <stamp class="mystamp" v-if="!sidList.length" stampStatus="NO_WATCHLIST" ignoreLogin="true" @onStampClick="onStampClick"/>
    </div>
</template>

<script>
export default {
	props: ['notPopupDialog'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
    methods: {
        onStampClick() {
            // 跳轉期貨頁。
            this.$store.state.bottomBar.activeKey = "market";
        }
    },
	watch: {},
    computed: {
        // 持倉列表
        focusList() {return this.$store.state.data.focusList;},
        // 自選第一組列表。
        ssgList0() {
            return this.$store.state.data.ssgList[0].param;
        },
        sidList() {
            return this.focusList;
        },
    },
}
</script>

<style scoped>
.quote-card-sd {
    width: 75vw;
}
</style>