"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/page",{

/***/ "(app-pages-browser)/./src/app/components/draggable/draggable.js":
/*!***************************************************!*\
  !*** ./src/app/components/draggable/draggable.js ***!
  \***************************************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": function() { return /* binding */ Draggable; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var next_image__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/image */ \"(app-pages-browser)/./node_modules/next/dist/api/image.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n\n\nfunction Draggable(param) {\n    let { ...props } = param;\n    _s();\n    const [position, setPosition] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)({\n        x: 10,\n        y: 50\n    });\n    const [dragging, setDragging] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);\n    const handleDrag = (e)=>{\n        setPosition({\n            x: e.clientX,\n            y: e.clientY\n        });\n    };\n    console.log(position);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        onMouseDown: (e)=>{\n            setDragging(true);\n        },\n        onMouseMove: (e)=>{\n            if (dragging) {\n                handleDrag(e);\n            }\n        },\n        onMouseUp: (e)=>{\n            setDragging(false);\n        },\n        style: {\n            position: \"absolute\",\n            top: position.y - 17.5,\n            left: position.x - 50,\n            zIndex: dragging ? 1000 : 0,\n            ...props.style\n        },\n        children: props.children\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Jxmoo\\\\Documents\\\\GitHub\\\\Cow-Farm-Simulator-Remastered\\\\src\\\\app\\\\components\\\\draggable\\\\draggable.js\",\n        lineNumber: 22,\n        columnNumber: 9\n    }, this);\n}\n_s(Draggable, \"mbBEuoi9cUrCLWX+SY8HEcxlhl4=\");\n_c = Draggable;\nvar _c;\n$RefreshReg$(_c, \"Draggable\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9hcHAvY29tcG9uZW50cy9kcmFnZ2FibGUvZHJhZ2dhYmxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFK0I7QUFDYTtBQUNYO0FBRWxCLFNBQVNHLFVBQVUsS0FBVTtRQUFWLEVBQUMsR0FBR0MsT0FBTSxHQUFWOztJQUU5QixNQUFNLENBQUNDLFVBQVVDLFlBQVksR0FBR0osK0NBQVFBLENBQUM7UUFBQ0ssR0FBRztRQUFJQyxHQUFHO0lBQUU7SUFDdEQsTUFBTSxDQUFDQyxVQUFVQyxZQUFZLEdBQUdSLCtDQUFRQSxDQUFDO0lBRXpDLE1BQU1TLGFBQWEsQ0FBQ0M7UUFDaEJOLFlBQVk7WUFDUkMsR0FBR0ssRUFBRUMsT0FBTztZQUNaTCxHQUFHSSxFQUFFRSxPQUFPO1FBQ2hCO0lBQ0o7SUFFQUMsUUFBUUMsR0FBRyxDQUFDWDtJQUVaLHFCQUNJLDhEQUFDWTtRQUVHQyxhQUFhLENBQUNOO1lBQ1ZGLFlBQVk7UUFDaEI7UUFFQVMsYUFBYSxDQUFDUDtZQUNWLElBQUlILFVBQVU7Z0JBQ1ZFLFdBQVdDO1lBQ2Y7UUFDSjtRQUVBUSxXQUFXLENBQUNSO1lBQ1JGLFlBQVk7UUFDaEI7UUFFQVcsT0FBTztZQUNIaEIsVUFBVTtZQUNWaUIsS0FBS2pCLFNBQVNHLENBQUMsR0FBRztZQUNsQmUsTUFBTWxCLFNBQVNFLENBQUMsR0FBRztZQUNuQmlCLFFBQVFmLFdBQVcsT0FBTztZQUMxQixHQUFHTCxNQUFNaUIsS0FBSztRQUNsQjtrQkFFQ2pCLE1BQU1xQixRQUFROzs7Ozs7QUFHM0I7R0ExQ3dCdEI7S0FBQUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vc3JjL2FwcC9jb21wb25lbnRzL2RyYWdnYWJsZS9kcmFnZ2FibGUuanM/Njc2MSJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBjbGllbnRcIlxyXG5cclxuaW1wb3J0IEltYWdlIGZyb20gXCJuZXh0L2ltYWdlXCI7XHJcbmltcG9ydCBzdHlsZXMgZnJvbSBcIi4vZHJhZ2dhYmxlLm1vZHVsZS5jc3NcIjtcclxuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERyYWdnYWJsZSh7Li4ucHJvcHN9KSB7XHJcblxyXG4gICAgY29uc3QgW3Bvc2l0aW9uLCBzZXRQb3NpdGlvbl0gPSB1c2VTdGF0ZSh7eDogMTAsIHk6IDUwfSk7XHJcbiAgICBjb25zdCBbZHJhZ2dpbmcsIHNldERyYWdnaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuXHJcbiAgICBjb25zdCBoYW5kbGVEcmFnID0gKGUpID0+IHtcclxuICAgICAgICBzZXRQb3NpdGlvbih7XHJcbiAgICAgICAgICAgIHg6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgeTogZS5jbGllbnRZXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2cocG9zaXRpb24pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIDxkaXZcclxuXHJcbiAgICAgICAgICAgIG9uTW91c2VEb3duPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2V0RHJhZ2dpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIH19XHJcblxyXG4gICAgICAgICAgICBvbk1vdXNlTW92ZT17KGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkcmFnZ2luZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZURyYWcoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH19XHJcblxyXG4gICAgICAgICAgICBvbk1vdXNlVXA9eyhlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzZXREcmFnZ2luZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIH19XHJcblxyXG4gICAgICAgICAgICBzdHlsZT17e1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcclxuICAgICAgICAgICAgICAgIHRvcDogcG9zaXRpb24ueSAtIDE3LjUsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBwb3NpdGlvbi54IC0gNTAsXHJcbiAgICAgICAgICAgICAgICB6SW5kZXg6IGRyYWdnaW5nID8gMTAwMCA6IDAsXHJcbiAgICAgICAgICAgICAgICAuLi5wcm9wcy5zdHlsZVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgID5cclxuICAgICAgICAgICAge3Byb3BzLmNoaWxkcmVufVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgKTtcclxufVxyXG4iXSwibmFtZXMiOlsiSW1hZ2UiLCJzdHlsZXMiLCJ1c2VTdGF0ZSIsIkRyYWdnYWJsZSIsInByb3BzIiwicG9zaXRpb24iLCJzZXRQb3NpdGlvbiIsIngiLCJ5IiwiZHJhZ2dpbmciLCJzZXREcmFnZ2luZyIsImhhbmRsZURyYWciLCJlIiwiY2xpZW50WCIsImNsaWVudFkiLCJjb25zb2xlIiwibG9nIiwiZGl2Iiwib25Nb3VzZURvd24iLCJvbk1vdXNlTW92ZSIsIm9uTW91c2VVcCIsInN0eWxlIiwidG9wIiwibGVmdCIsInpJbmRleCIsImNoaWxkcmVuIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/app/components/draggable/draggable.js\n"));

/***/ })

});