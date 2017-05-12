<#setting locale    = "en_US">
<#assign cont       = 1>
<#assign currency   = transaction.currency.symbol>
<#assign descGlobal = transaction.discounttotal*-1?c?number>
<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>
<Comprobantes>
<Comprobante>
<informacionOrganismo>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<ext:UBLExtensions>
		<ext:UBLExtension>
			<ext:ExtensionContent>
				<sac:AdditionalInformation>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1001</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1001-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1002</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1002-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1003</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1003-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1004</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1004-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<#if transaction.custbody_lmry_concepto_detraccion != '' && transaction.custbody_lmry_concepto_detraccion != 'SIN DETRACCIÓN'>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>2003</cbc:ID>
						<!--Codigo de tipo de elemento tabla 14-->
						<cbc:PayableAmount currencyID="${currency}">${transaction.custbody_lmry_wtax_amount?string["#.##"]}</cbc:PayableAmount>
						<cbc:Percent>-PORCENTAJE-${transaction.custbody_lmry_wtax_rate?string["#.##"]}-PORCENTAJE-</cbc:Percent>
						<!--Monto de la detraccion-->
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalProperty>
						<cbc:ID>3000</cbc:ID>
						<!--Detracciones: CODIGO DE BB Y SS SUJETOS A DETRACCION-->
						<cbc:Value>-CODIGO3000-</cbc:Value>
					</sac:AdditionalProperty>
					<sac:AdditionalProperty>
						<cbc:ID>3001</cbc:ID>
						<!--Numero de cuenta de banco-->
						<cbc:Value>-NUMERO3001-</cbc:Value>
					</sac:AdditionalProperty>
					</#if>
					<!-- DISCOUNTTOTAL : ${transaction.discounttotal} - DISCOUNTRATE : ${transaction.discountrate} - *DISCRATE*${transaction.discountrate?c}*DISCRATE* - ${transaction.discountrate?c?number?string["#.###"]} - ${transaction.discountrate?c}-->					
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>2005</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO2005-${descGlobal?string["#.##"]}-MONTO2005-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalProperty>
						<cbc:ID>1000</cbc:ID>
						<cbc:Value><#if transaction.total?c?number == 0>CERO </#if>${transaction.custbody_monto_letras_pa}</cbc:Value>
					</sac:AdditionalProperty>
					<#if transaction.total?c?number == 0>
					<!-- AQUI FALTA CAMPO PARA LEYENDA -->
					<sac:AdditionalProperty>
						<cbc:ID>1002</cbc:ID>
						<cbc:Value>TRANSFERENCIA GRATUITA DE UN BIEN Y/O SERVICIO PRESTADO GRATUITAMENTE</cbc:Value>
					</sac:AdditionalProperty>
					</#if>
				</sac:AdditionalInformation>
			</ext:ExtensionContent>
		</ext:UBLExtension>
	</ext:UBLExtensions>
	<cbc:UBLVersionID>2.0</cbc:UBLVersionID>
	<cbc:CustomizationID>1.0</cbc:CustomizationID>
	<!-- *PTOVTA*  *PTOVTA1* -->
	<cbc:ID>-NUMERACION-${transaction.custbody_lmry_serie_doc_cxc + "-" + transaction.custbody_lmry_num_preimpreso}-NUMERACION-</cbc:ID>
	<cbc:IssueDate>${transaction.trandate}</cbc:IssueDate>
	<cbc:InvoiceTypeCode>${transaction.custbody_lmry_document_type.custrecord_lmry_codigo_doc}</cbc:InvoiceTypeCode>
	<cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
	<#if transaction.custbody_lmry_ref_guia_numero != ''>
	<cac:DespatchDocumentReference>
		<cbc:ID>${transaction.custbody_lmry_ref_guia_numero}</cbc:ID>
		<cbc:DocumentTypeCode>09</cbc:DocumentTypeCode>
	</cac:DespatchDocumentReference>
	</#if>
	<cac:AccountingSupplierParty>
		<!--transaction.subsidiary.taxidnum - ${transaction.internalid} - ${transaction.internalidnumber} - ${transaction.id} -->
		<cbc:CustomerAssignedAccountID>${transaction.subsidiary.taxidnum}</cbc:CustomerAssignedAccountID>
		<cbc:AdditionalAccountID>${transaction.subsidiary.custrecord_tipo_doc_id_sunat_id}</cbc:AdditionalAccountID>
		<cac:Party>
			<!-- legalname -->
			<cac:PartyName>
				<cbc:Name>${transaction.subsidiary.legalname}</cbc:Name>
			</cac:PartyName>
			<cac:PostalAddress>
				<cbc:ID>-UBIGEO-</cbc:ID>
				<cbc:StreetName>${transaction.subsidiary.address1}</cbc:StreetName>
				<cbc:CityName>${transaction.subsidiary.city}</cbc:CityName>
				<cbc:CountrySubentity>-DETRA-${transaction.custbody_lmry_wtax_code_des}-DETRA-</cbc:CountrySubentity>
				<cbc:District>${transaction.subsidiary.address2}</cbc:District>
				<cac:Country>
					<cbc:IdentificationCode>PE</cbc:IdentificationCode>
				</cac:Country>
			</cac:PostalAddress>
			<cac:PartyLegalEntity>
				<cbc:RegistrationName>${transaction.subsidiary.legalname}</cbc:RegistrationName>
			</cac:PartyLegalEntity>
		</cac:Party>
	</cac:AccountingSupplierParty>
	<cac:AccountingCustomerParty>
		<cbc:CustomerAssignedAccountID>${customer.vatregnumber}</cbc:CustomerAssignedAccountID>
		<cbc:AdditionalAccountID>${customer.custentity_tipo_doc_id_sunat.custrecord_tipo_doc_id}</cbc:AdditionalAccountID>
		<cac:Party>
			<cac:PhysicalLocation>
				<cbc:Description>${transaction.billaddress}</cbc:Description>
			</cac:PhysicalLocation>
			<cac:PartyLegalEntity>
				<cbc:RegistrationName>${customer.companyname}</cbc:RegistrationName>
			</cac:PartyLegalEntity>
		</cac:Party>
	</cac:AccountingCustomerParty>
	<cac:TaxTotal>
		<cbc:TaxAmount currencyID="${currency}">${transaction.taxtotal?c?number?string["#.##"]}</cbc:TaxAmount>
		<cac:TaxSubtotal>
			<cbc:TaxAmount currencyID="${currency}">${transaction.taxtotal?c?number?string["#.##"]}</cbc:TaxAmount>
			<cac:TaxCategory>
				<cac:TaxScheme>
					<cbc:ID>1000</cbc:ID>
					<cbc:Name>IGV</cbc:Name>
					<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>
	</cac:TaxTotal>
	<cac:LegalMonetaryTotal>
		<cbc:PayableAmount currencyID="${currency}">${transaction.total?c?number?string["#.##"]}</cbc:PayableAmount>
		<#if transaction.discounttotal != 0>
		<cbc:AllowanceTotalAmount currencyID="${currency}">${descGlobal?string["#.##"]}</cbc:AllowanceTotalAmount>
		</#if>
	</cac:LegalMonetaryTotal>
	<!-- *Ezi4* *Ezi5*-->
	<#list transaction.item as item>
	<#if item.amount \gt 0>
	<cac:InvoiceLine>
		<!-- *Ezi1* *Ezi2* *Ezi3* -->
		<!-- List Price : ${item.id} - ${item.linenumber} - ${item.licensecode} - ${item.line} - ${item.displayname} - ${item.number} - ${item.price} - ${item.internalid} - ${item.internalidnumber} - ${item.code} - ${item.custitem15} - ${item.itemid} - ${item.custcol4} -->
		<cbc:ID>${cont}</cbc:ID>
		<#assign cont = cont + 1>
		<cbc:InvoicedQuantity unitCode="${item.units}">-QTY-${item.quantity?c?number?string["#.###"]}-QTY-</cbc:InvoicedQuantity>
		<cbc:LineExtensionAmount currencyID="${currency}">-MONTOLINEA--MONTO-${item.amount?c?number?string["#.##"]}-MONTO--MONTOLINEA-</cbc:LineExtensionAmount>
		<cac:PricingReference>
			<cac:AlternativeConditionPrice>
				<#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
				<!-- ${precUnit} - Unidad Medida: ${item.units}  -->
				<cbc:PriceAmount currencyID="${currency}">${precUnit?c?number?string["#.##"]}</cbc:PriceAmount>
				<cbc:PriceTypeCode>01</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
		</cac:PricingReference>
		<!-- ITEMTAXRATE : ${item.taxrate1} - ${item.taxrate1?c?number} -->
		<cac:TaxTotal>
			<cbc:TaxAmount currencyID="${currency}">-TAXAMOUNT-${item.tax1amt?c?number?string["#.##"]}-TAXAMOUNT-</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxAmount currencyID="${currency}">-TAXAMOUNT-${item.tax1amt?c?number?string["#.##"]}-TAXAMOUNT-</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:TaxExemptionReasonCode>-COD-${item.taxcode}-COD-</cbc:TaxExemptionReasonCode>
					<cac:TaxScheme>
						<cbc:ID>1000</cbc:ID>
						<cbc:Name>IGV</cbc:Name>
						<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>
		<cac:Item>
			<cbc:Description>${item.custcol4} ${item.description}</cbc:Description>
			<cac:SellersItemIdentification>
				<cbc:ID>-PRICES-${item.price}-PRICES-</cbc:ID>
			</cac:SellersItemIdentification>
		</cac:Item>
		<cac:Price>
			<cbc:PriceAmount currencyID="${currency}">${item.rate?c?number?string["#.##"]}</cbc:PriceAmount>
		</cac:Price>
	</cac:InvoiceLine>
	<#elseif item.amount \lt 0>
	<cac:InvoiceLine>
		<!-- *Ezi1* *Ezi2* *Ezi3* -->
		<!-- *ESDESC* -->
		<!-- List Price : ${item.id} - ${item.linenumber} - ${item.licensecode} - ${item.line} - ${item.displayname} - ${item.number} - ${item.price} - ${item.internalid} - ${item.internalidnumber} - ${item.code} - ${item.custitem15} - ${item.itemid} - ${item.custcol4} -->
		<cbc:ID>${cont}</cbc:ID>
		<#assign cont = cont + 1>
		<cbc:InvoicedQuantity unitCode="${item.units}">-QTY-1-QTY-</cbc:InvoicedQuantity>
		<#assign montoDesc = item.amount*-1?c?number>
		<cbc:LineExtensionAmount currencyID="${currency}">-MONTOLINEA-${montoDesc?string["#.##"]}-MONTOLINEA-</cbc:LineExtensionAmount>
		<cac:PricingReference>
			<cac:AlternativeConditionPrice>
				<cbc:PriceAmount currencyID="${currency}">0.00</cbc:PriceAmount>
				<cbc:PriceTypeCode>01</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
			<cac:AlternativeConditionPrice>
				<#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
				<!-- ${precUnit} - Unidad Medida: ${item.units} -->
				<cbc:PriceAmount currencyID="${currency}">-MONTODESC-${montoDesc?string["#.##"]}-MONTODESC-</cbc:PriceAmount>
				<cbc:PriceTypeCode>02</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
		</cac:PricingReference>
		<!-- *AXL*  -  *1001*  -  *SLASH* -->
		<!-- ITEMTAXRATE : ${item.taxrate1} - ${item.taxrate1?c?number} -->
		<cac:TaxTotal>
			<cbc:TaxAmount currencyID="${currency}">0</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxAmount currencyID="${currency}">0</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:TaxExemptionReasonCode>31</cbc:TaxExemptionReasonCode>
					<cac:TaxScheme>
						<cbc:ID>1000</cbc:ID>
						<cbc:Name>IGV</cbc:Name>
						<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>
		<cac:Item>
			<cbc:Description>${item.custcol4} ${item.description}</cbc:Description>
			<cac:SellersItemIdentification>
				<cbc:ID>-PRICES-${item.price}-PRICES-</cbc:ID>
			</cac:SellersItemIdentification>
		</cac:Item>
		<cac:Price>
			<cbc:PriceAmount currencyID="${currency}">-MONTODESC-${montoDesc?string["#.##"]}-MONTODESC-</cbc:PriceAmount>
		</cac:Price>
	</cac:InvoiceLine>
	</#if>
	</#list>

</Invoice>
<TextosLibres>
	<TextoLibre1>${transaction.otherrefnum}</TextoLibre1>
	<TextoLibre2>${transaction.custbody_lmry_ref_guia_numero}</TextoLibre2>
	<TextoLibre3>${transaction.terms}</TextoLibre3>
	<TextoLibre4>${transaction.duedate}</TextoLibre4>
	<TextoLibre5>${customer.entityid}</TextoLibre5>
	<TextoLibre6>-DETRACCION-</TextoLibre6>
	<TextoLibre7>${transaction.currency}</TextoLibre7>
	<TextoLibre8>${transaction.tranid}</TextoLibre8>
	<TextoLibre9>DESCUENTO LOGISTICO + DESCUENTO PROTO PAGO APLICADO + DESCUENTO TRANSPORTE</TextoLibre9>
	<TextoLibre10>${transaction.createdfrom}</TextoLibre10>
	<TextoLibre11>${transaction.salesrep}</TextoLibre11>
	<TextoLibre12>${transaction.custbody_lmry_informacion_adicional}</TextoLibre12>
	<TextoLibre13>${transaction.shipaddress}</TextoLibre13>
	<TextoLibre14>-2005-</TextoLibre14>
	<TextoLibre15>-1001-</TextoLibre15>
	<TextoLibre16>-1002-</TextoLibre16>
	<TextoLibre17>-1003-</TextoLibre17>
	<TextoLibre18>-DESCITEM-</TextoLibre18>
</TextosLibres>
</informacionOrganismo>
</Comprobante>
</Comprobantes>