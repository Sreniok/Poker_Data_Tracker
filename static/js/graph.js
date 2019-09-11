queue()
    .defer(d3.csv, "data/pokerData.csv")
    .await(makeGraphs);

function makeGraphs(error, pokerData) {
    var ndx = crossfilter(pokerData);
    var parseDate = d3.time.format("%d/%m/%Y").parse

    pokerData.forEach(function (d) {
        d.position = parseInt(d.position);
        d.wins = parseInt(d.win);
        d.date = parseDate(d.date);
        d.spend = parseInt(d.spend);
    });


    show_gameType_selector(ndx);
    show_players(ndx);
    show_total_buy_in(ndx);
    show_profit(ndx);
    show_average_position(ndx);
    show_wins_by_month_per_person(ndx);
    show_location_of_play(ndx);


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

    dc.barChart("#totla_wins")
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
        .yAxisLabel("$$$")
        .yAxis().ticks(20);
};

function show_total_buy_in(ndx, element) {
    var name_dim = ndx.dimension(dc.pluck('name'));
    var total_buy_in_per_player = name_dim.group().reduceSum(dc.pluck("spend"));

    dc.pieChart("#total-buy-in")
        .height(330)
        .radius(90)
        .transitionDuration(1500)
        .dimension(name_dim)
        .group(total_buy_in_per_player);
};

function show_profit(ndx) {
    var player_dim = ndx.dimension(dc.pluck('name'));

    function add_item(p, v) {
        p.total_wins += v.wins;
        p.total_spend += v.spend;
        p.profit = p.total_wins - p.total_spend;
        return p;
    }

    function remove_item(p, v) {
        p.total_wins -= v.wins;
        if (p.total_wins == 0) {
            p.total_spend = 0;
            p.profit = 0;
        } else {
            p.total_spend -= v.spend;
            p.profit = p.total_wins - p.total_spend;
        }
        return p;
    }

    function initialise() {
        return {
            total_wins: 0,
            total_spend: 0,
            profit: 0
        };
    }

    var profit_dim = player_dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#profit")
        .width(400)
        .height(300)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 50
        })
        .dimension(player_dim)
        .group(profit_dim)
        .valueAccessor(function (d) {
            return d.value.profit.toFixed(1);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .yAxisLabel("$$$")
        .yAxis().ticks(20);
}

function show_average_position(ndx) {
    var avr_dim = ndx.dimension(dc.pluck('name'));

    function add_item(p, v) {
        p.count++;
        p.total += v.position;
        p.average = p.total / p.count;
        return p;
    }

    function remove_item(p, v) {
        p.count--;
        if (p.count == 0) {
            p.total == 0;
            p.average = 0;
        } else {
            p.total -= v.position;
            p.average = p.total / p.count;
        }
        return p;
    }



    function initialise() {
        return {
            count: 0,
            total: 0,
            average: 0
        };
    }
    var averagePositionByPlayer = avr_dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#avr_position")
        .width(400)
        .height(300)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 50
        })
        .dimension(avr_dim)
        .group(averagePositionByPlayer)
        .valueAccessor(function (d) {
            return d.value.average.toFixed(1);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .y(d3.scale.linear()
            .domain([0, d3.max(ndx)])
            .range([0, 300]))
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .yAxisLabel("Position")
        .yAxis().ticks()
}

function show_wins_by_month_per_person(ndx) {
    var date_dim = ndx.dimension(dc.pluck('date'));

    var minDate = date_dim.bottom(1)[0].date;
    var maxDate = date_dim.top(1)[0].date;

    var tereskaWinByMonth = date_dim.group().reduceSum(function (d) {
        if (d.name === 'Tereska') {
            return +d.win;
        } else {
            return 0;
        }
    });

    var filipWinByMonth = date_dim.group().reduceSum(function (d) {
        if (d.name === 'Filip') {
            return +d.win;
        } else {
            return 0;
        }
    });

    var lukaszWinByMonth = date_dim.group().reduceSum(function (d) {
        if (d.name === 'Lukasz') {
            return +d.win;
        } else {
            return 0;
        }
    });

    var compositeChart = dc.compositeChart("#months");

    compositeChart
        .width(990)
        .height(200)
        .dimension(date_dim)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .yAxisLabel("$$$")
        .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .compose([
            dc.lineChart(compositeChart)
            .colors('green')
            .group(tereskaWinByMonth, 'Tereska'),
            dc.lineChart(compositeChart)
            .colors('Red')
            .group(filipWinByMonth, 'Filip'),
            dc.lineChart(compositeChart)
            .colors('blue')
            .group(lukaszWinByMonth, 'Lukasz'),

        ])
        .brushOn(false);
}

function show_location_of_play(ndx) {
    var location_dim = ndx.dimension(dc.pluck('location'));
    var games_dim = location_dim.group().reduceSum(dc.pluck('win'))

    dc.pieChart('#location')
        .height(330)
        .radius(90)
        .transitionDuration(1500)
        .dimension(location_dim)
        .group(games_dim);
}