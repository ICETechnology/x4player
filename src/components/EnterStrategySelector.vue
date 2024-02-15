<template>
    <div class="enter-strategy-selector-ctn flex-col pdlr3 pdt2">
		<div class="flex-row">
			<Button class="flex-1 btn outline mg2 pdtb1 pdlr3 flex-center flex-row" @click="onStragegy(0)">
				<span class="icon icon0 mgl1 mgr3" />
				<span class="flex-1">{{$ln(`突破策略`)}}</span>
			</Button>
			<Button class="flex-1 btn outline mg2 pdtb1 pdlr3 flex-center flex-row" @click="onStragegy(1)">
				<span class="icon icon1 mgl1 mgr3" />
				<span class="flex-1">{{$ln(`震荡策略`)}}</span>
			</Button>
		</div>
		<div class="flex-row mgt1">
			<Button class="flex-1 btn outline mg2 pdtb1 pdlr3 flex-center flex-row" @click="onStragegy(2)">
				<span class="icon icon2 mgl1 mgr3" />
				<span class="flex-1">{{$ln(`区间做多`)}}</span>
			</Button>
			<Button class="flex-1 btn outline mg2 pdtb1 pdlr3 flex-center flex-row" @click="onStragegy(3)">
				<span class="icon icon3 mgl1 mgr3" />
				<span class="flex-1">{{$ln(`区间做空`)}}</span>
			</Button>
		</div>
    </div>
</template>

<script>
import EnterStrategyOrderBox from "@/components/EnterStrategyOrderBox.vue";
export default {
	components: {
		EnterStrategyOrderBox,
	},
	beforeMount() {
		this.$emit(`title`, this.$ln(`进场策略选择`));
	},
    methods: {
		onStragegy(type) {
			eventBus.$emit("POPUP-DIALOG", EnterStrategyOrderBox, {type:type}, {transName: 'float'});
		},
	},
}
</script>

<style scoped>
.icon {
	width: 36px;
	height: 25px;
	display: block;
	background-repeat: no-repeat;
	background-size: contain;
}
.icon0 {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAvCAYAAABTy8xRAAAAAXNSR0IArs4c6QAABbBJREFUaAXtWl1sFFUUvmdmbHemJaUEoZgilXa3NATC7golPmlEY4iiIF3aPmgfTEQJJqY+GMODT0ai4aH+J4qEmG5dKUjUxBhTjUYSQawPEti20RgJsSGibenM7Dozx3NXl0y3u93Z7c7OkHSSydy599x7v++bc/8H2E124SehlSnViqLJIshYlOCvlNc074B7vjbKoSKVk6laefDk5lWptB5FxCgyK0L1RtUZ8/Y59QtwoFzyvBzfCICJjU0pMx1FILJIXxZZRNVnm+eQzX0BNqmsbj7K2ERuiuN3TwXA0+3LtFnzODLsVA19TQY1+bXTC1A4Ql9fd2qfz07IF1mtOHg4OcMEOEP1/Ue+tIr/kuuEt0rLMt/aUwE4HKV7/BUAOD0fWrEYeC0jYDGzIumeC8DxyYH6PmDwSxGsN5LJdlYJSAM3IhYR8IUAsPunvyVge8kTUo64COxt2HPpT0e2RYx8IQDHWNMzMUojwDNF8DIuEqJ4pJid03TfCEBjPQgMmooBB8RjdT3JK8XsnKaDU0M37fDTTY3qtPoB1bGT2vdlel6noXFDbp0AzARRCsqx5K+5aeW+e+4B6URwizat/UAEdhLBEVliEUESHyEhZuaTgnglyfPyPRVAGww9bpjWGfra66ltH5bFyP0Qm7gaiCWThO0JuwAkDorIXrbHVSLsSROgaW+NbugDFmNPMgbTAEKf0jN2KpeQOhQcQMs6yOPJIz5Weid259os9r3qHqDGW9dqRurbDHmAC6Igbc1HnhOThZrnyDO+52EUhJf4s9JXVQXQPwztoM7+R3L5beTScWWF0hnovjRWiBTELqRBrI2Rmw7VdY+dK2Tn+3g+xGnxthfUwVZTHWxLq/Fg0fHeTgrxRdc+lOt9ACaiDZo5dZxE2EXufIUJYkzZl/zOTtDLsKsCpBIbNpmmcZLIt1En9o3MAjHo/XnSS8K5dQO55BvUxfLdlopfRJxPZpbzgqnN01gPZW1bVRzY/wXSZsjTdLONBHS7W5Vky6VdnjupL8+++uJpAjT4AsgSiCUFlhRYUmBJAY8UAFqcDNPgdJdr9SMtuYHR2sd/F4iwRyLyMwzhmhvwaJopZHZ2qBKaBqdpLlD+EY4LANESDFenwhyzOtTWRd//PRJiGYnwuizW9vNVngt8yirSdQE4Kv1ER9D8J32CJoKbaUp8DmpquuRHL/5WFuIKZ3JtmWnHGdh7cVwRV22ndnCUmsFWK5Ue1YeCD9ptCoXxq7sldSjUXSh9sfFV8QA7SC0e7KOj7jcpLkB9z2FZCh+C2Eem3cYepib0KkN8Shahhe8X2tMqEa6KB9iByj3jx0Txlk6KG6d+4XnNGB3B4Y68h6O8/0AL+8lrFM1k/fZyKhWuugdkgWeOxlXzXVqJxmiYnBRQ6pV7kyPZ9NRQsMNEPEvp9TyOOtDr1IGuow60oiNW1T0gS5Cf7Co9E/voOOggbZY0IhhfUPM4RISBi2Na1qkseZ6Hh1VTfzabv1JPzzzATkBNhLYxw0zQdGEdferPCRTNGXCX3SYTBjaliMvJC85PzUsrM8IzD7DjVWJjZ2UpEKGm8Bl96gfykucZkDXo5nRJG6r2evKFfeEBWWBaPHSvheaX2fe8T4BriiK2VOLnCF6+LzyAA1GH25otZsV5eMELcYWumQcWtCkh0RcewI/K+GkRPzBxhB3gqlLf0AIPnVcd2S9g5AsP4OeEjslzMoi3arNT+xfg5TjJcw/gM0MLrfcdI84aAvtDaVp7x039mxwf76nHf4wWSKW7MrImbfL3OUfoWW1KeXruARwsJrrENBttt4zM/79hflBDwmyhpMyhSiFCNIG6LEu1rYtZXvtCgEIE9eHQesvAMK0H+MkV3RimucDqOfaCsL+ue/ydOXElvPhagHw8ZuPtt4nMCtOskf4Wt8K0SmiUm5rvK/eH6X8B5gP1MBumo5YAAAAASUVORK5CYII=');
}
.icon1 {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAAAsCAYAAAA6ndXBAAAAAXNSR0IArs4c6QAAA0dJREFUaAXtmW9oT1EYx393m7BYmz9DJJuY//MvVki8UHijlNLeemGpvVJqJSnFi63wQlFqiZIUEvHKXlBeIEuUJClFMv/GxPDzeeqcup3dv7/rbvee35769NxzznPOPd/nnu2e37lOsVjsKRQKG6FcbVMVynuhIsUMzGfsaWr8Z/i+FO9VytCfS+kUqw8rbQrcBrE3sC7WALYEI7wCDsIfGIT9tmiLrQPxm+EdiF2DuiiDENcMLVFicxGDmBnQA2KvYHXQxGmvg5dwKygud20IqoSj8Bd+wj4vEdTLn9EN0LbGKy7XdSjbBn1K4UX8RLcgyodVm3bX3e3WXKNuNtxXKp/jl4o4/HaQlWLaSmvEu4WgcgwcV2oH8Afgkyqb7oq7r3XXqN0JX0zVRllWxzLrxLsFIfCyIdqreMndx6pr1LZ7Kfaok03XIqvEixhErYdfHoL9qi5YlQRUygbqrZ9an/rf1MuPs/wbQuTNcNdHaFh1d/4zgAJU7oUfYWp92uXHWGPSRDhJB/gf/REi5xoLYQXIZkj8cqiBMDvrOM6esKCg9kwkwWuCJEbmNhd0UrSfasQPUp5HIl4b9ZGLmU2CnwKSM5M2nRDtb5KENr8+ZVFPYqL82ZRFLkZFjmagnDPA/wLZaMn549YkeUjze0OSeQ3pi9Dx0AJtcAYeENQPj2HBkA4xKjL5ikRgLRpks6RfgeKboBJMe09FA6/IAbMhall2aiNqCK5nAqvALbghxqQ6kyQgxn3SCyUJu6BU+0DHCenNbhhHRkhniVnoGMZppnsrElAFd2Im4iPxdu0UEVQP8sE2qh1K99GM0OioXwvyRSrM5ERa3iB2GuLOh2WA9iNWqkdYNXSrBHh9eVJNxX4uJluXBEQ1wROl8hF+CTxUZdMdszEBu1EpT1fsNIwTkfg5IPsAt32nYJ4s5TcniBkLp5TCb/hWUw11W0A+tGjrMmNyW0ZRI+jl/pRrOWT1NNo6QExOpKd7BuWtEiE7QH9xPsd1dZAG2h24CieD4nLRhgj57d8FYvJUIx+TE1sD+V4FCJgF90DsBTRn6cnJUjvBhORjR5q2mMEnqRv04r+mebOYY7fLeYI8lQ0xOyYJz9QqQEjtP5JOAOZnx3yvAAAAAElFTkSuQmCC');
}
.icon2 {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAAAqCAYAAADsxDbcAAAAAXNSR0IArs4c6QAAAhVJREFUaAXtmLlLA0EUxrMeoAiChVqYwsITjCg2IgEJ/iGCYiGIpYKtnb29B4paWYqVWGovCDYiooW2gvGIvyezIcgue4TZuMt78DGTub9v3kx2npNLmVUqlWaWPAwmwKRJbx3HWSEfy5xYvRLqBOEOphoHQtglPUa+Hbj2TaaACDduQdS0JWoHW+0h3MvY7s66pAcpawqY86QeAQLGTqYa8gvgCcSxLzqNJrNSi7NAog1cxVGAPocWl5bs0JDJg+eIQogXjCS7UsuzQagIyhGEOLC8pMYMjwDLIUUQL5C/yWwa5I5DCLGfTfawgvwSeAsQ4ZP6ocyJAKlOcGTIv5DOg0fz+2+yl0UBpmB5Z5hekvYJSdJp8G7K3US8QD6gsmMQWgVCVC66TSDvgqrxexHU2m61Mu0ZWHWBU8NOvhbn/DhRt23aiRcM+LVLVTlEZsC9IXZOKm8GX6O+Fcgx2fFtlJYKSDhgHXwA2dUNEPQ4+qVHux7QnxaunuuEQDc4A2IPoOjZsEGFsjtbzF2wPL88kV23vyb/anm+KMOviQgX9JiN0itjbUsZ46N0VAFVoE4F/nW02YsbF7mG3BFGQ+4e3qEhd46Hhtw9PCOdRexmHmjIHRGKoAzCmobcUUpD7uk8+CFWze5qyN1cBhpyRwgNudeeGgTRkLsIghAackcEDbkbb9CQe+09YSOvIfdcTkPueFbpBxO+3598ClB6AAAAAElFTkSuQmCC');
}
.icon3 {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAAAwCAYAAABOiRchAAAAAXNSR0IArs4c6QAAA19JREFUaAXtmstr1EAcxzetbUFbD74KKvjAUuqD+gARFSv04EmUolcRRC9eBCmCIHoUD4LgHyAUQYRVULFQ+gf4ullaoRefqAe1Su1B266fX5mBYTubzMbNbjLkBx8mmfllZr7fTjZpkqBUKhULhcJ+SCqa6Hg+qc5r0O/AEjqZhqkadFapi3U0dKjG95QzlRIbVD+b+ListA3wDCTewI7EB03jAAhvgZsgMQNn0jjPuswJ8cfhB0gMwTKXgcnrhl0uuZnIQcxGeAES47AtbOK0d8AEPArLy1wbglrhFkj8htM2EdQH8AB0+LMatGCUDcCUUniHcqluk5L9y6pNFw/Ndm+2UbcZXimVY5Q9yoAjbM+pel3Ms9HrjXhTCMLa4LZSOk15Eb6r/fJCbu78DdSehJ/lqsv2ZTX4fa+BwGKZaNvufW+XAmov2BRb6mQ1hF5aM2kSovrgL7jGvUwKrTRpVK+Hr67qVZ5cORauJJX6zUw9QuTK8FwJq7a4mxmhYRNF9VnQ/09Ua4Kshu6w/l3aApekeuQgZhPjyG2xyVqHsYeCIDjlkFcxJTUm2GaIMWuoN02R7S1gznuO/R6MmKSMFWZnsTqo90EY086YO8E05yUmnKv3XFI1HsY0p2pC+WRyB3IHcgdyB3IHoh3g8pX6exF5mjuKlL5oObEzxIRS7KOTP7Bf3kWOQ1uCY3XRd6fqf4LyW4Jjxen6V5yDqjqGlbYKhkHiIxysqgNfkhEup528Q5gFeXp0CVL/W5GI/wg/BJ9A4imsdBmIvN2Q5DcULtOoXQ5iVsMISHyAUHG0y+n0FuQH3J9AUBNcAX16DLK96PSgrhlGQccBf1xQSlB2GD4rhY8pV5gi2b+h2nQxYrZ7s426TtB/7Xds7xNxlPI2yhYL7d4YoIWgVE6PqyAPTv/AdZB3krYY1sd5WaK4H77YlJfV7fXSABGFULmfkEtnVDzx2YRrUeqN9j3eGYG4oyAvWl3Du2+YulCuP9txNUHy5LF79gMh7TAmimJETb5hku+OGx0nmID8Kx/nmcMxjPvvb5gW3ao2yhHELGdsEWS+WdrKfkvEnIq8fRIjY0dqTLApwJhW6reDaYwYZX4JKyuoFyNeU8aKVJtgU4QxcgrL0yrTmElMOG/Ld6n7BxGS1RQZ9l47AAAAAElFTkSuQmCC');
}
</style>