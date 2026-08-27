import { Pressable, StyleSheet, Text, View } from "react-native"; 
import React from "react"; 
import { MaterialCommunityIcons } from "@expo/vector-icons"; 

const CheckBox = (props) => {

	const iconName = props.isChecked ? 
		"checkbox-marked" : "checkbox-blank-outline"; 

	return ( 
		<View style={styles.ckboxcontainer}> 
			<Pressable onPress={props.onPress}> 
				<MaterialCommunityIcons 
					name={iconName} size={25} color="#228B22" /> 
			</Pressable> 
			<Text style={styles.ckboxtitle}>{props.title}</Text> 
		</View> 
	); 
}; 

export default CheckBox; 


const styles = StyleSheet.create({ 
	ckboxcontainer: { 
		justifyContent: "flex-start", 
		alignItems: "center", 
		flexDirection: "column", 
		width: 57,
		height: 55, 
		marginTop: 5,
		marginBottom: 4, 
		marginHorizontal: 0,
		backgroundColor: '#d8fffd',
		borderWidth:.7,
	}, 
	ckboxtitle: { fontSize: 13, color: "#000", marginLeft: 0, fontWeight: "600" }, 
}); 