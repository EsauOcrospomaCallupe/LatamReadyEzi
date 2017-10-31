/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(["N/record", "N/search", "N/log", "N/runtime"],

function(record, search, log, runtime) {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

        return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {
        return true;
    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
        return true;
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

        return true;
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

        return true;
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

        return true;
    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

        var currentRecord = scriptContext.currentRecord;
        var sublistName   = scriptContext.sublistId;
        var fieldName     = scriptContext.fieldId;

        var subsi  = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"});

        var param_date_from = currentRecord.getText("date_from");
        var param_date_to   = currentRecord.getText("date_to");
        var param_serie     = currentRecord.getValue("serie");
        if (subsi) {
            var param_subsidiary = currentRecord.getValue("subsidiary");
        }
        //alert(date_from + " - " + date_to)

        /* Búsqueda Personalizada LatamReady - PE EI Boleteo Masivo Docs */ 
        busqBolMas = search.load({
            id: 'customsearch_lmry_pe_ei_bol_mas_docs'
        });
        if (param_date_from != null && param_date_from != '' && param_date_to != null && param_date_to != '' && param_serie != null && param_serie != '') {
            filter_date_from = search.createFilter({
                name: 'custrecord_lmry_pe_ei_date',
                operator: search.Operator.ONORAFTER,
                values: [param_date_from]
            });
            filter_date_to = search.createFilter({
                name: 'custrecord_lmry_pe_ei_date',
                operator: search.Operator.ONORBEFORE,
                values: [param_date_to]
            });
            filter_status = search.createFilter({
                name: 'custrecord_lmry_pe_ei_status',
                operator: search.Operator.ISNOT,
                values: ['AUTORIZADO']
            });            
            filter_status2 = search.createFilter({
                name: 'custrecord_lmry_pe_ei_status',
                operator: search.Operator.ISNOT,
                values: ["Procesando"]
            });
            filter_line = search.createFilter({
                name: 'custrecord_lmry_pe_ei_id_line',
                operator: search.Operator.EQUALTO,
                values: [1]
            });
            filter_serie = search.createFilter({
                name: 'custrecord_lmry_pe_ei_point_sale',
                operator: search.Operator.ANYOF,
                values: param_serie
            });
            group_by = search.createColumn({
                name: 'custrecord_lmry_pe_ei_id_doc',
                summary: search.Summary.GROUP
            });
            busqBolMas.filters = [filter_date_from, filter_date_to, filter_status, filter_status2, filter_line, filter_serie];
            if (subsi) {
                if (param_subsidiary != null && param_subsidiary != '') {
                    filter_subsi = search.createFilter({
                        name: 'custrecord_lmry_pe_ei_subsidiary',
                        operator: search.Operator.ANYOF,
                        values: param_subsidiary
                    });
                    busqBolMas.filters.push(filter_subsi);
                }
            }
            busqBolMas.columns = [group_by];
            resultBolMas = busqBolMas.run().getRange(0, 1000);
            cantidadTx   = resultBolMas.length;
            //alert("Cantidad : " + cantidadTx);
            if (cantidadTx == 0 || resultBolMas == null) {
                return alert('No se han encontrado transacciones con los criterios ingresados.');
            }else{
                return confirm('Este proceso enviará ' + cantidadTx + ' transacciones según criterios ingresados.\n'+"Desea continuar?");
            }
        }

        return true;

    }

    return {
        pageInit: pageInit,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        saveRecord: saveRecord
    };

});