<template>
    <div class="flex-row">
		<div class="account-ctn posr">
			<LoginedBTOManager />
		</div>
		<RightsInfo class="flex-1 posr" />
		<DesktopAccountMenu class="function-ctn" />
    </div>
</template>

<script>
import DesktopAccountMenu from '@/components/DesktopComponents/DesktopAccountMenu.vue'
import RightsInfo from '@/components/RightsInfo.vue'
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		this.$emit('title', '资金账户管理');
		this.$emit('dialogClass', `dialog-size-big`);
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		DesktopAccountMenu,
		RightsInfo,
	},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.account-ctn {
	width: 16em;
	max-width: 25%;
	background-color: #464646;
}
.function-ctn {
	width: 10em;
	background-color: #464646;
}
</style>