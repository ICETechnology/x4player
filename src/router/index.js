import Vue from 'vue'
import Router from 'vue-router'
import Login from "@/components/Login";
import Main from "@/components/Framework/Main";

// import MixMarket from "@/components/Mix/mix.market";
import MixTrading from "@/components/Mix/mix.trading";
import MixAccount from "@/components/Mix/mix.account";
import MixSetting from "@/components/Mix/mix.setting";
import MixChart from "@/components/MixChart.vue";

Vue.use(Router)

export default new Router({
  routes: [
	{path: '/', component: Login},
	{name: 'login', path: '/login', component: Login},
	{name: 'main', path: '/main', component: Main,
		children: [
			// {name: 'market', path: 'market', component: MixMarket, props: {active:true}},
			{name: 'trade', path: 'trade', component: MixTrading, props: {active:true}},
			{name: 'account', path: 'account', component: MixAccount, props: {active:true}},
			{name: 'setting', path: 'setting', component: MixSetting, props: {active:true}},
			{name: 'MixChart', path: 'MixChart', component: MixChart, props: {active:true}},
		],
	},
  ]
})