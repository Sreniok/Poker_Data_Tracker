queue()
    .defer(d3.csv, "data/pokerData.csv")
    .await(makeGraphs);

function makeGraphs(error, pokerData) {
    var ndx = crossfilter(pokerData);

    show_gameType_selector(ndx);
    show_players(ndx);
    show_total_buy_in(ndx);
    show_profit(ndx);

    dc.renderAll()
}


function show_gameType_selector(ndx) {
    dim = ndx.dimension(dc.pluck('type'));
    group = dim.group()

    dc.selectMenu("#game-type")
        .dimension(dim)
        .group(group);
}

function show_players(ndx) {
    var player_dim = ndx.dimension(dc.pluck('name'));
    var total_win = player_dim.group().reduceSum(dc.pluck('win'));

    dc.barChart("#players")
        .width(400)
        .height(300)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 50
        })
        .dimension(player_dim)
        .group(total_win)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Players")
        .yAxisLabel(" Money Win")
        .yAxis().ticks(20);
}

function show_total_buy_in(ndx) {
    var name_dim = ndx.dimension(dc.pluck('name'));
    var total_buy_in_per_player = name_dim.group().reduceSum(dc.pluck('spend'));

    dc.pieChart("#total-buy-in")
        .height(330)
        .radius(90)
        .transitionDuration(1500)
        .dimension(name_dim)
        .group(total_buy_in_per_player);
}

function show_profit(ndx) {
    var name_dim = ndx.dimension(dc.pluck('name'));
    var profit = name_dim.group().reduce(



        function (p, v) {
            p.spend += v.spend;
            p.totalWin += v.win;
            p.profit = v.win - v.spend;
            return p;
        },

        function (p, v) {
            p.spend -= v.spend;
            if (p.count == 0) {
                p.totalWin = 0;
                p.profit = 0;
            } else {
                p.totalWin -= v.win;
                p.profit = p.totalWin - p.spend;
                return p;
            }
            return p;
        },

        function () {
            return {
                count: 0,
                total: 0,
                profit: 0
            };
        }
    );



    var profit_chart = dc.barChart("#profit");

    profit_chart
        .width(500)
        .height(300)
        .dimension(name_dim)
        .group(profit)
        .valueAccessor(function (d) {
            return d.value.profit;
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal);


}