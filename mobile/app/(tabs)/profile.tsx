import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '../../src/config/firebaseConfig';
import { db } from '../../src/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../src/context/AuthContext'; // Import AuthContext
import { useRouter } from 'expo-router';

const ProfileScreen = () => {
  const { user, loading: authLoading } = useAuth(); // Get user and loading state from AuthContext
  const [userData, setUserData] = useState(null); // Additional Firestore data
  const [loading, setLoading] = useState(true); // Local loading state for Firestore fetch
  const router = useRouter();

  // Fetch additional user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setUserData({});
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/login'); // Redirect to login after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner while auth or Firestore data is being fetched
  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  // If no user is logged in, redirect or show a message (shouldn't happen with proper routing)
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user logged in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* User Photo */}
      {user.photoURL ? (
        <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>{user.email?.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      {/* User Details */}
      <Text style={styles.name}>{userData?.name || user.displayName || 'Unnamed User'}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});

export default ProfileScreen;