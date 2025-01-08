import { HandSealJutsuMatcher } from "./hand-seal-jutsu-matcher"

export default function JutsuDashboard() {

  return (
    <div className="container mx-auto py-10">
      <HandSealJutsuMatcher />
      {/* <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Jutsu Database</h1>
        <ThemeToggle />
      </div> */}

      {/* <Tabs defaultValue="hand-seals" className="space-y-8"> */}
        {/* <TabsList>
          <TabsTrigger value="hand-seals">Hand Seal Detection</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-8">
          <div className="flex flex-wrap gap-4">
            <FilterSelect
              title="Classification"
              options={filterOptions.classification}
              selected={selectedFilters
                .filter((f) => f.category === "Classification")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Classification", value)}
            />
            <FilterSelect
              title="Nature"
              options={filterOptions.nature}
              selected={selectedFilters
                .filter((f) => f.category === "Nature")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Nature", value)}
            />
            <FilterSelect
              title="Rank"
              options={filterOptions.rank}
              selected={selectedFilters
                .filter((f) => f.category === "Rank")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Rank", value)}
            />
            <FilterSelect
              title="Class"
              options={filterOptions.class}
              selected={selectedFilters
                .filter((f) => f.category === "Class")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Class", value)}
            />
            <FilterSelect
              title="Range"
              options={filterOptions.range}
              selected={selectedFilters
                .filter((f) => f.category === "Range")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Range", value)}
            />
            <FilterSelect
              title="Hand Seals"
              options={filterOptions.hand_seals}
              selected={selectedFilters
                .filter((f) => f.category === "Hand Seals")
                .map((f) => f.value)}
              onSelect={(value) => handleFilterSelect("Hand Seals", value)}
            />
          </div>

          <SelectedFilters
            selected={selectedFilters}
            onRemove={handleFilterRemove}
          />

          <div className="mt-8">
            <JutsuTable data={filteredData} columns={columns} />
          </div>
        </TabsContent> */}

        {/* <TabsContent value="hand-seals">
          <HandSealJutsuMatcher />
        </TabsContent>
      </Tabs> */}
    </div>
  )
}

