/**
 * Module for processing detected JSON shapes into HTML code.
 *
 * @ Aaron Baw 2018
 */

 // Dependencies.
 const shapeMap = require('../config/shapeMap.json');
 const indent = require('indent-string');

 // Generate code for a single shape element.
 function generateShapeCode(container, containingCode){

   if (!container) return "";

   return `
   <div style="height:${container.meta.relativeHeight};" class="${shapeMap[container.type]}" data-id="${container.id}">
   <label style="align-self:flex-start;">${container.id}</label>
      ${indent(containingCode, 8)}
   </div>`;

 }

 // Takes JSON representation of detected shapes and outputs serialised HTML.
 function generateCode(shapes){
   if (!shapes || shapes.length == 0) return "";

   var output = "";

   shapes.forEach(shape => {

     console.log(shape);

     output += generateShapeCode(shape, generateCode(shape.contains));
   });

   return output;
 }

// Configure module.
module.exports = generateCode;
