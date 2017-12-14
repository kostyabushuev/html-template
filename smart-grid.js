var smartgrid = require('smart-grid');

var settings = {
    filename: "_smart-grid",
    outputStyle: "sass",
    columns: 12,
    offset: "30px",
    container: {
        maxWidth: "1100px",
        fields: "15px"
    },
    breakPoints: {
        lg: {
            width: "1100px",
            fields: "15px"
        },
        md: {
            width: "992px",
            fields: "15px"
        },
        sm: {
            width: "768px",
            fields: "15px"
        },
        xs: {
            width: "480px",
            fields: "15px"
        }
    },
    mixinNames: {
        container: "container",
        row: "row-flex",
        rowFloat: "row-float",
        column: "col",
        size: "size",
        columnFloat: "col-float",
        columnPadding: "col-padding",
        offset: "offset"
    },
    properties: [
        "justify-content",
        "align-items",
        "align-content",
        "align-self",
        "order",
        "flex",
        "flex-grow",
        "flex-shrink",
        "flex-basis",
        "flex-direction",
        "flex-wrap",
        "flex-flow",
        "float"
    ],
    tab: "    ",
    oldSizeStyle: true
}
 
smartgrid('app/sass/', settings);