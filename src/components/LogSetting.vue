<template>
    <div class="hidden">
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
    },
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {
        // 市價轉換設定
        '$store.state.convertMarketPrice':{
            handler(nv){
                console.log('[LogSetting]', '市價轉換設定', nv);
            },
            deep:true
        },
        // 閃電下單設定
        '$store.state.thunder.settings':{
            handler(nv){
                console.log('[LogSetting]', '閃電下單設定', nv);
            },
            deep:true
        },
        // 雲端條件單簽署版號
        '$store.state.config.localSmoAgreementVersion'(nv){
            console.log('[LogSetting]', '雲端條件單簽署版號', nv);
        },
        '$store.state.login.loginReady'(nv){
            // 登入後再log設定
            if(!nv) return;
            console.log('[LogSetting]', '閃電下單設定', this.$store.state.thunder.settings);
            console.log('[LogSetting]', '交易設定', this.$store.state.order);
            console.log('[LogSetting]', '雲端條件單簽署版號', this.$store.state.config.localSmoAgreementVersion);
            console.log('[LogSetting]', '市價轉換設定', this.$store.state.convertMarketPrice);
        }
    },
    computed: {},
}
</script>

<style scoped>
</style>