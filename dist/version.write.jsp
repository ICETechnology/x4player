<%@page contentType="text/html; charset=UTF-8"%>
<%@page import="java.io.*"%>
<%@page import="java.util.*"%>
<%@page import="java.text.*"%>
<%@page import="org.json.simple.JSONArray"%>
<%@page import="org.json.simple.JSONObject"%>
<%@page import="org.json.simple.parser.JSONParser"%>
<%@page import="org.json.simple.parser.ParseException"%>

<%
	String path = application.getRealPath("/").replace('\\', '/');
	String filePath = path + "/dist/version.json";

	JSONObject obj = (JSONObject)new JSONParser().parse(new FileReader(filePath));
	String v = request.getParameter("v");
	String l = request.getParameter("l");
	if (v != null) {obj.put("v", v);}
	if (l != null) {obj.put("l", l);}

	// 寫入 json 檔
	File strFile = new File(filePath);
	Writer objWriter = new OutputStreamWriter(new FileOutputStream(strFile.getAbsolutePath()), "UTF-8");
	objWriter.write(obj.toString());
	objWriter.flush();
	objWriter.close();	
%>

<%=obj.toString()%>