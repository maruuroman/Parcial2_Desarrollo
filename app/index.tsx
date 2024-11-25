import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Platform } from "react-native";

export default function Index() {
  interface Pais {
    id: number;
    name: string;
    description: string;
    goals: number; 
    points: number;
    logo: string;
  }

  const baseUrl = "http://161.35.143.238:8000/mroman";
  const [paises, setPaises] = useState<Pais[]>([]);
  const [currentPais, setCurrentPais] = useState<Pais | null>(null); 
  const [isAdding, setIsAdding] = useState(false); // Modo agregar/editar
  const [form, setForm] = useState<{ name: string; description: string;  goals: number;
    points: number; logo: string; }>({
    name: "",
    description: "",
    goals: 0,
    points: 0,
    logo: "",
  });
  const [originalPaises, setOriginalPaises] = useState<Pais[]>([]);
  // Estilos para el botón de agregar pais
  const platformStyles = StyleSheet.create({
    addButton: {
      backgroundColor: Platform.OS === "android" ? "blue" : "green",
      padding: 10,
      borderRadius: 5,
      alignSelf: Platform.OS === "android" ? "flex-start" : "flex-end",
    },
    addButtonText: {
      color: Platform.OS === "android" ? "white" : "black",
      fontSize: 16,
    },
  });

  
  // Obtener paises desde el backend al cargar el componente
  useEffect(() => {
    fetch( baseUrl, {
      headers: {
        "bypass-tunnel-reminder": "true"
      }
    })
      .then((response) => response.json())
      .then((data) => 
        {setPaises(data);
         setOriginalPaises(data);
        })
      .catch((error) => console.error("Error al obtener los paises:", error));
  }, []);

  // Función para ordenar por cantidad de goles (mayor a menor)
  const sortByGoals = () => {
    const sortedPaises = [...paises].sort((a, b) => b.goals - a.goals);
    setPaises(sortedPaises);
  };

  // Función para restablecer el orden original
  const resetOrder = () => {
    setPaises(originalPaises);
  };

  // Función para manejar el formulario
  const handleFormChange = (field: keyof typeof form, value: any) => {
    setForm({ ...form, [field]: value });
  };
 
  /*
  const renderPoints = (goals: string[] | undefined) => {
    return goals && goals.length > 0 ? goals.join(", ") : "Ninguna";
  };
  */

  // Agregar o editar pais
  const savePais = () => {
    const method = currentPais ? "PUT" : "POST";
    const url = currentPais
      ? `${baseUrl}/${currentPais.id}`
      : baseUrl;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        goals: form.goals,
        points: form.points,
        logo: form.logo,

      }),
    })
      .then((response) => response.json())
      .then((savedPais) => {
        if (currentPais) {
          // Actualizar pais existente
          setPaises((prev) =>
            prev.map((pais) =>
              pais.id === currentPais.id ? savedPais : pais
            )
          );
        } else {
          // Agregar nuevo pais
          setPaises((prev) => [...prev, savedPais]);
        }
        setForm({ name: "", description: "", goals: 0, points: 0, logo: "" });
        setCurrentPais(null);
        setIsAdding(false);
      })
      .catch((error) => console.error("Error al guardar el pais:", error));
  };
  
  // Eliminar pais
  const deletePais = (id: number) => {
    fetch(`${baseUrl}/${id}`, { method: "DELETE", headers: {
      "bypass-tunnel-reminder": "true"
    }})
      .then(() => {
        setPaises((prev) => prev.filter((pais) => pais.id !== id));
        setCurrentPais(null);
      })
      .catch((error) => console.error("Error al eliminar el pais:", error));
  };

    
  // Volver a la lista
  const goBack = () => {
    setCurrentPais(null);
    setIsAdding(false);
  };

  
  return (
    <View style={styles.container}>
      {/* Pantalla de listado de paises */}
      {!currentPais && !isAdding && (
        <View>
          <Text style={styles.title}>Paises</Text>
          <View style={styles.sortButtonsContainer}>
            <Button title="Ordenar por goles" onPress={sortByGoals} />
            <Button title="Restablecer Orden" onPress={resetOrder} />
          </View>
          <FlatList
            data={paises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }: { item: Pais }) => (
              <TouchableOpacity
                style={styles.paisItem}
                onPress={() => setCurrentPais(item)}
              >
                <Image source={{ uri: item.logo }} style={styles.paisLogo} />
                <Text style={styles.paisName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          {/*<Button title="Agregar Pais" onPress={() => setIsAdding(true)} />*/}
        
          <TouchableOpacity
            style={platformStyles.addButton}
            onPress={() => setIsAdding(true)}
          >
            <Text style={platformStyles.addButtonText}>
              {Platform.OS === "android" ? "Nuevo Pais" : "Crear Pais"}
            </Text>
          </TouchableOpacity>



        
        </View>

      )}

      {/* Pantalla de detalles del Pais */}
      {currentPais && !isAdding && (
        <View>
          <Text style={styles.title}>Detalles del Pais</Text>
          <Image source={{ uri: currentPais.logo }} style={styles.paisLogo} />
          <Text>Nombre: {currentPais.name}</Text>
          <Text>Descripción: {currentPais.description}</Text>
          <Text>Cantidad de goles: {currentPais.goals}</Text>
          <Text>Puntos: {currentPais.points}</Text>
          <Button
            title="Editar"
            onPress={() => {
              setForm({
                name: currentPais.name || "",
                description: currentPais.description || "",
                goals: currentPais.goals || 0,
                points: currentPais.points || 0,
                logo: currentPais.logo || "",
              });
              setIsAdding(true);
            }}
          />
          <Button
            title="Eliminar"
            color="red"
            onPress={() => deletePais(currentPais.id)}
          />
          <Button title="Volver" onPress={goBack} />
        </View>
      )}

      {/* Pantalla para agregar/editar pais */}
      {isAdding && (
        <View>
          <Text style={styles.title}>
            {currentPais ? "Editar Pais" : "Agregar Pais"}
          </Text>
          <TextInput
            placeholder="Nombre"
            value={form.name}
            onChangeText={(text) => handleFormChange("name", text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Descripción"
            value={form.description}
            onChangeText={(text) => handleFormChange("description", text)}
            style={styles.input}
          />

          <TextInput
            placeholder="Cantidad de Goles"
            value={form.goals.toString()}
            onChangeText={(text) => handleFormChange("goals", parseInt(text) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Campo para nombres los puntos */}
          <TextInput
            placeholder="Cantidad de puntos"
            value={form.points.toString()}
            onChangeText={(text) => handleFormChange("points", parseInt(text) || 0)}
            style={styles.input}
          />

          {/* Campo para URL de la imagen */}
          <TextInput
            placeholder="URL de la imagen"
            value={form.logo}
            onChangeText={(text) => handleFormChange("logo", text)}
            style={styles.input}
          />


          <Button title="Guardar" onPress={savePais} />
          <Button title="Cancelar" onPress={goBack} />
        </View>
      )}
    </View>
  );
}


// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e2f7fc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  paisItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#3d88e9",
  },
  paisLogo: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 25,
  },
  paisName: {
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#184887",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  sortButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },  
});