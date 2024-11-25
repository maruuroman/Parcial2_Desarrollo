import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Platform } from "react-native";

export default function Index() {
  interface Planet {
    id: number;
    name: string;
    description: string;
    moons: number; 
    moon_names: string[] | undefined;
    image: string;
  }

  const baseUrl = "http://161.35.143.238:8000/mroman";
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [currentPlanet, setCurrentPlanet] = useState<Planet | null>(null); // Planeta seleccionado
  const [isAdding, setIsAdding] = useState(false); // Modo agregar/editar
  const [form, setForm] = useState<{ name: string; description: string;  moons: number;
    moon_names: string[]; image: string; }>({
    name: "",
    description: "",
    moons: 0,
    moon_names: [],
    image: "",
  });
  const [originalPlanets, setOriginalPlanets] = useState<Planet[]>([]);
  // Estilos para el botón de agregar planeta
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

  
  // Obtener planetas desde el backend al cargar el componente
  useEffect(() => {
    fetch( baseUrl, {
      headers: {
        "bypass-tunnel-reminder": "true"
      }
    })
      .then((response) => response.json())
      .then((data) => 
        {setPlanets(data);
         setOriginalPlanets(data);
        })
      .catch((error) => console.error("Error al obtener los planetas:", error));
  }, []);

  // Función para ordenar por cantidad de lunas (mayor a menor)
  const sortByMoons = () => {
    const sortedPlanets = [...planets].sort((a, b) => b.moons - a.moons);
    setPlanets(sortedPlanets);
  };

  // Función para restablecer el orden original
  const resetOrder = () => {
    setPlanets(originalPlanets);
  };

  // Función para manejar el formulario
  const handleFormChange = (field: keyof typeof form, value: any) => {
    setForm({ ...form, [field]: value });
  };
 
  const renderMoons = (moons: string[] | undefined) => {
    return moons && moons.length > 0 ? moons.join(", ") : "Ninguna";
  };

  // Agregar o editar planeta
  const savePlanet = () => {
    const method = currentPlanet ? "PUT" : "POST";
    const url = currentPlanet
      ? `${baseUrl}/${currentPlanet.id}`
      : baseUrl;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        moon: form.moons,
        moon_names: form.moon_names,
        image: form.image,

      }),
    })
      .then((response) => response.json())
      .then((savedPlanet) => {
        if (currentPlanet) {
          // Actualizar planeta existente
          setPlanets((prev) =>
            prev.map((planet) =>
              planet.id === currentPlanet.id ? savedPlanet : planet
            )
          );
        } else {
          // Agregar nuevo planeta
          setPlanets((prev) => [...prev, savedPlanet]);
        }
        setForm({ name: "", description: "", moons: 0, moon_names: [], image: "" });
        setCurrentPlanet(null);
        setIsAdding(false);
      })
      .catch((error) => console.error("Error al guardar el planeta:", error));
  };
  
  // Eliminar planeta
  const deletePlanet = (id: number) => {
    fetch(`${baseUrl}/${id}`, { method: "DELETE", headers: {
      "bypass-tunnel-reminder": "true"
    }})
      .then(() => {
        setPlanets((prev) => prev.filter((planet) => planet.id !== id));
        setCurrentPlanet(null);
      })
      .catch((error) => console.error("Error al eliminar el planeta:", error));
  };

    
  // Volver a la lista
  const goBack = () => {
    setCurrentPlanet(null);
    setIsAdding(false);
  };

  
  return (
    <View style={styles.container}>
      {/* Pantalla de listado de planetas */}
      {!currentPlanet && !isAdding && (
        <View>
          <Text style={styles.title}>Planetas</Text>
          <View style={styles.sortButtonsContainer}>
            <Button title="Ordenar por Lunas" onPress={sortByMoons} />
            <Button title="Restablecer Orden" onPress={resetOrder} />
          </View>
          <FlatList
            data={planets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }: { item: Planet }) => (
              <TouchableOpacity
                style={styles.planetItem}
                onPress={() => setCurrentPlanet(item)}
              >
                <Image source={{ uri: item.image }} style={styles.planetImage} />
                <Text style={styles.planetName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          {/*<Button title="Agregar Planeta" onPress={() => setIsAdding(true)} />*/}
        
          <TouchableOpacity
            style={platformStyles.addButton}
            onPress={() => setIsAdding(true)}
          >
            <Text style={platformStyles.addButtonText}>
              {Platform.OS === "android" ? "Nuevo Planeta" : "Crear Planeta"}
            </Text>
          </TouchableOpacity>;


        
        </View>

      )}

      {/* Pantalla de detalles del planeta */}
      {currentPlanet && !isAdding && (
        <View>
          <Text style={styles.title}>Detalles del Planeta</Text>
          <Image source={{ uri: currentPlanet.image }} style={styles.planetImage} />
          <Text>Nombre: {currentPlanet.name}</Text>
          <Text>Descripción: {currentPlanet.description}</Text>
          <Text>Número de lunas: {currentPlanet.moons}</Text>
          <Text>Lunas: {renderMoons(currentPlanet.moon_names)}</Text>
          <Button
            title="Editar"
            onPress={() => {
              setForm({
                name: currentPlanet.name || "",
                description: currentPlanet.description || "",
                moons: currentPlanet.moons || 0,
                moon_names: currentPlanet.moon_names || [],
                image: currentPlanet.image || "",
              });
              setIsAdding(true);
            }}
          />
          <Button
            title="Eliminar"
            color="red"
            onPress={() => deletePlanet(currentPlanet.id)}
          />
          <Button title="Volver" onPress={goBack} />
        </View>
      )}

      {/* Pantalla para agregar/editar planeta */}
      {isAdding && (
        <View>
          <Text style={styles.title}>
            {currentPlanet ? "Editar Planeta" : "Agregar Planeta"}
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

          {/* Campo para número de lunas */}
          <TextInput
            placeholder="Número de lunas"
            value={form.moons.toString()}
            onChangeText={(text) => handleFormChange("moons", parseInt(text) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Campo para nombres de lunas */}
          <TextInput
            placeholder="Nombres de las lunas (separadas por comas)"
            value={form.moon_names.join(", ")}
            onChangeText={(text) => handleFormChange("moon_names", text.split(",").map((name) => name.trim()))}
            style={styles.input}
          />

          {/* Campo para URL de la imagen */}
          <TextInput
            placeholder="URL de la imagen"
            value={form.image}
            onChangeText={(text) => handleFormChange("image", text)}
            style={styles.input}
          />


          <Button title="Guardar" onPress={savePlanet} />
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
  planetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#3d88e9",
  },
  planetImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 25,
  },
  planetName: {
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