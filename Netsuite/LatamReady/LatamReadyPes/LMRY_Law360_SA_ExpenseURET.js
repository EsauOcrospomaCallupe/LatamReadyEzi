/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Ene 2017     LatamReady Consultor
 * File : LMRY_Law360_SA_ExpenseURET.js
 */
// Nombre del Script
var LMRY_script = "LatamReady - Law360 SA Expense URET";
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function SAER_Uret_BeforeLoad(type, form, request){
	try{
		// Recuperamos valores
		var objContext = nlapiGetContext(); 
		var rolEmploye = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_rol');
		
		// Oculta el campo
		nlapiSetFieldDisplay('custrecord_lmry_law360_saccexpe_sched', false );

		// Transaccion en view
		if ( type=='view' ) {
			// remueve el boton editar
			form.removeButton('edit');
			
			// Internal id del Usuario
			var userid = nlapiGetUser();			
			// Nombre del Tipo de Rol
			var nameroce = objContext.getRoleCenter();
			// Internal ID del Rol
			var namerole = objContext.getRole();
			
			// Varificacion de variables
			nlapiLogExecution('ERROR', 'ver: userid, nameroce, namerole, rolEmploye' 
							 , userid + ' , ' + nameroce + ' , ' + namerole + ' , ' + rolEmploye);

			// Se valida que no se este procesando
			var projectid = nlapiGetFieldValue('custrecord_lmry_law360_saccexpe_project');
			var customeri = nlapiLookupField('job', projectid, 'customer');
			if ( (customeri==userid && nameroce=='CUSTOMER') || namerole==rolEmploye )
			{
				var procesado = nlapiGetFieldValue('custrecord_lmry_law360_saccexpe_state');
				if ( procesado!='Se esta procesando ...' )
				{
					if ( procesado!='Aprobado' )
					{
						form.addButton('custpage_button_approved', 'Aprobado' , "law360_onclick_er_approved();");
					}
					if ( procesado!='Rechazado' )
					{
						form.addButton('custpage_button_reject'  , 'Rechazado', "law360_onclick_er_reject();");
				
					}
					form.addButton('custpage_button_refresh'  , 'Actualizar', "law360_onclick_er_refresh();");
					form.setScript('customscript_lmry_law360_sa_expense_clnt');
				}				
			}
		}

		// Transaccion en create & edit
		if ( type=='create' || type=='edit') {
			// remueve el boton editar
			form.removeButton('submitter');
			form.removeButton('resetter');
		}
	}catch(err){
		// Envia correo de error al usuario
		law360_sendemail(err + ' [SAER_Uret_BeforeLoad]', LMRY_script);		
	}
}