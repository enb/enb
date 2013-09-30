var ENB_ROOT = "../../../../";
module.exports = function(config) {
    config.setLanguages(["en"]);

    config.node("page", function(nodeConfig) {
        nodeConfig.addTechs([
            [ require(ENB_ROOT + "techs/levels"), { levels: getLevels() } ],
            [ require(ENB_ROOT + "techs/deps-old"), { depsTarget: '?.old.deps.js' } ],
            require(ENB_ROOT + "techs/deps"),
            require(ENB_ROOT + "techs/files"),
            [ require(ENB_ROOT + "techs/file-provider"), { target: "?.bemjson.js" } ],
            [ require(ENB_ROOT + "techs/bemdecl-from-bemjson"), { target: "?.bemdecl.js" } ],
            [ require("bh/techs/bh-server"), { bhFile: '../../../node_modules/bh/lib/bh.js' } ],
            require(ENB_ROOT + "techs/html-from-bemjson"),
            require(ENB_ROOT + "techs/html-from-bemjson-i18n"),
            [ require(ENB_ROOT + "techs/i18n-merge-keysets"), { lang: "all" }],
            [ require(ENB_ROOT + "techs/i18n-merge-keysets"), { lang: "{lang}" }],
            [ require(ENB_ROOT + "techs/i18n-lang-js"), { lang: "all" } ],
            [ require(ENB_ROOT + "techs/i18n-lang-js"), { lang: "{lang}" } ],
            [ require(ENB_ROOT + "techs/js-i18n"), { lang: "{lang}" } ],
            require(ENB_ROOT + "techs/css"),
            require(ENB_ROOT + "techs/css-ie"),
            require(ENB_ROOT + "techs/css-ie7"),
            require(ENB_ROOT + "techs/priv-js"),
            [ require(ENB_ROOT + "techs/priv-js-i18n"), { lang: "{lang}" } ]
        ]);
        nodeConfig.addTargets(["?.html", "?.en.html", "?.{lang}.js", "?.css", "?.ie.css", "?.ie7.css", "?.{lang}.priv.js", "?.old.deps.js"]);

        function getLevels() {
            return [
                'blocks'
            ].map(function(l) { return config.resolvePath(l); });
        }
    });
};
