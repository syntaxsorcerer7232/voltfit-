# Firebase Database Index Documentation

To ensure that the global leaderboard functions efficiently and instantly, we require a Firestore composite index on the `public_profiles` collection.

## Required Composite Index

| Collection | Field 1 | Field 2 | Scope |
| :--- | :--- | :--- | :--- |
| `public_profiles` | `points` (Descending) | `__name__` (Descending) | Collection |

### How to configure this index:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **studied-standard-v07pf** (or target project).
3. In the left-hand navigation, click **Firestore Database**.
4. Click on the **Indexes** tab at the top.
5. Click **Add Index** (Composite).
6. Enter the following details:
   - **Collection ID**: `public_profiles`
   - **Fields to index**:
     - Field path: `points`, Query scope: **Collection**, Sort order: **Descending**
     - Field path: `__name__`, Query scope: **Collection**, Sort order: **Descending**
7. Click **Create Index**.

Creating the index may take a couple of minutes to propagate, after which queries on the global leaderboard sorting by points descending will execute instantly.
